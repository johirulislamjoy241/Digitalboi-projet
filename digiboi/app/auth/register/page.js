'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { BD_DIVISIONS, getDistricts, getUpazilas, getPostcode } from '@/lib/bd-locations';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [step, setStep] = useState(0);
  const [bizType, setBizType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [mapLocation, setMapLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [owner, setOwner] = useState({
    fullName: '', phone: '', email: '', password: '', confirmPass: '', nidNumber: ''
  });
  const [shop, setShop] = useState({
    shopName: '', division: '', district: '', upazila: '', thana: '', postCode: '',
    address: '', shopPhone: '', tradeLicense: '', fbPageUrl: '', websiteUrl: ''
  });

  const upd = (setter) => (field, val) => setter(prev => ({ ...prev, [field]: val }));
  const updOwner = upd(setOwner);
  const updShop = upd(setShop);

  useEffect(() => {
    if (shop.district && shop.upazila) {
      const pc = getPostcode(shop.district, shop.upazila);
      if (pc) setShop(prev => ({ ...prev, postCode: pc }));
    }
  }, [shop.upazila]);

  const handleDivisionChange = (val) => {
    setShop(prev => ({ ...prev, division: val, district: '', upazila: '', thana: '', postCode: '' }));
  };
  const handleDistrictChange = (val) => {
    setShop(prev => ({ ...prev, district: val, upazila: '', thana: '', postCode: '' }));
  };

  const toBase64 = (file) => new Promise(res => {
    const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file);
  });

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) { setError('সর্বোচ্চ ৫টি ছবি যোগ করা যাবে'); return; }
    const b64s = await Promise.all(files.map(toBase64));
    setPhotos(p => [...p, ...b64s]); setError('');
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) { setError('লোকেশন সাপোর্ট নেই'); setGettingLocation(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapLocation(loc);
        setGettingLocation(false);
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&accept-language=bn`)
          .then(r => r.json())
          .then(data => {
            if (data.display_name) {
              setShop(prev => ({ ...prev, address: data.display_name.split(',').slice(0, 4).join(', ') }));
            }
          }).catch(() => {});
      },
      () => { setError('লোকেশন পাওয়া যায়নি। ব্রাউজারে অনুমতি দিন।'); setGettingLocation(false); }
    );
  };

  const validateStep = () => {
    if (step === 0 && !bizType) return 'ব্যবসার ধরন বাছুন';
    if (step === 1) {
      if (!owner.fullName.trim()) return 'পূর্ণ নাম দিন';
      if (!owner.phone.trim()) return 'ফোন নম্বর দিন';
      const phoneClean = owner.phone.replace(/[\s\-()+]/g, '');
      if (!/^(8801|01|1)[3-9]d{8}$/.test(phoneClean)) return 'সঠিক বাংলাদেশী ফোন নম্বর দিন (01XXXXXXXXX)';
      if (!owner.password) return 'পাসওয়ার্ড দিন';
      if (owner.password.length < 8) return 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে';
      if (owner.password !== owner.confirmPass) return 'পাসওয়ার্ড দুটো মিলছে না';
    }
    if (step === 2) {
      if (!shop.shopName.trim()) return 'ব্যবসার নাম দিন';
      if (!shop.division) return 'বিভাগ বাছুন';
      if (!shop.district) return 'জেলা বাছুন';
      if (!shop.upazila) return 'উপজেলা বাছুন';
      if (!shop.address.trim()) return 'সম্পূর্ণ ঠিকানা দিন';
      if (bizType === 'physical' && !shop.tradeLicense.trim()) return 'ট্রেড লাইসেন্স নম্বর দিন';
      if (bizType === 'physical' && photos.length === 0) return 'অন্তত ১টি দোকানের ছবি দিন';
      if (bizType === 'online' && !shop.fbPageUrl.trim() && !shop.websiteUrl.trim()) return 'Facebook Page বা Website লিংক দিন';
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(); if (err) { setError(err); return; }
    setError(''); setStep(s => s + 1);
  };

  const normalizePhone = (phone) => {
    const clean = phone.replace(/\s|-/g, '');
    if (clean.startsWith('880')) return '+' + clean;
    if (clean.startsWith('0')) return '+88' + clean;
    return '+880' + clean;
  };

  const handleSubmit = async () => {
    const err = validateStep(); if (err) { setError(err); return; }
    setLoading(true); setError('');
    try {
      const normalizedPhone = normalizePhone(owner.phone);
      const parts = [shop.address, shop.upazila, shop.thana, shop.district, shop.division];
      if (shop.postCode) parts.push(shop.postCode);
      const fullAddress = parts.filter(Boolean).join(', ');

      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          email: owner.email || null,
          password: owner.password,
          fullName: owner.fullName,
          nidNumber: owner.nidNumber || null,
          shopName: shop.shopName,
          businessType: bizType,
          address: fullAddress,
          district: shop.district,
          division: shop.division,
          upazila: shop.upazila,
          thana: shop.thana || null,
          postCode: shop.postCode || null,
          latitude: mapLocation?.lat || null,
          longitude: mapLocation?.lng || null,
          shopPhone: shop.shopPhone || null,
          tradeLicense: shop.tradeLicense || null,
          shopPhotos: photos,
          fbPageUrl: shop.fbPageUrl || null,
          websiteUrl: shop.websiteUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'সমস্যা হয়েছে'); return; }
      setAuth(data.user, data.shop, data.token);
      document.cookie = `digiboi_token=${data.token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      if (bizType === 'online' && data.shop?.verification_code) {
        setVerificationCode(data.shop.verification_code);
        setStep(3);
      } else {
        router.push('/dashboard');
      }
    } catch { setError('সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।'); }
    finally { setLoading(false); }
  };

  const inp = { width: '100%', padding: '13px 14px', border: '2px solid #E8EDF5', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: "'Hind Siliguri',sans-serif", background: 'white', color: '#141D28' };
  const lbl = { fontSize: '13px', fontWeight: '600', color: '#5E6E8A', display: 'block', marginBottom: '6px' };
  const req = <span style={{ color: '#E63946' }}> *</span>;
  const wrap = { marginBottom: '14px' };

  const districts = getDistricts(shop.division);
  const upazilas = getUpazilas(shop.district);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0F4C81 0%,#1E6FC8 35%,#F4F7FB 35%)', fontFamily: "'Hind Siliguri',sans-serif", padding: '16px 16px 32px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <div style={{ textAlign: 'center', paddingTop: '20px', marginBottom: '16px' }}>
        <div style={{ width: '56px', height: '56px', background: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          <span style={{ fontWeight: '800', fontSize: '26px', color: '#0F4C81', fontFamily: "'Syne',sans-serif" }}>D</span>
        </div>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: '800', margin: 0 }}>নতুন অ্যাকাউন্ট</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '4px 0 0' }}>🇧🇩 শুধুমাত্র বাংলাদেশের জন্য</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
        {['ধরন', 'মালিক', 'দোকান'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step > i ? '#0BAA69' : step === i ? 'white' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: step === i ? '#0F4C81' : 'white', flexShrink: 0 }}>
              {step > i ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '11px', fontWeight: step === i ? '700' : '400', color: step >= i ? 'white' : 'rgba(255,255,255,0.5)' }}>{label}</span>
            {i < 2 && <div style={{ width: '20px', height: '2px', background: step > i ? '#0BAA69' : 'rgba(255,255,255,0.3)', borderRadius: '2px', flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '24px', padding: '22px 20px', maxWidth: '460px', margin: '0 auto', boxShadow: '0 12px 40px rgba(0,0,0,0.14)' }}>

        {error && <div style={{ background: '#FDECEA', border: '1px solid #E63946', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#E63946', fontWeight: '600' }}>⚠️ {error}</div>}

        {/* STEP 0 */}
        {step === 0 && <>
          <h2 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: '800', color: '#141D28' }}>ব্যবসার ধরন বাছুন</h2>
          <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#8A9AB5' }}>এটি পরে পরিবর্তন করা যাবে না</p>
          <div style={{ background: '#EBF5FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🇧🇩</span>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0F4C81' }}>বাংলাদেশ-সীমাবদ্ধ সেবা</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#5E6E8A' }}>শুধুমাত্র বাংলাদেশে পরিচালিত ব্যবসার জন্য</p>
            </div>
          </div>
          {[{ k: 'physical', icon: '🏪', title: 'ফিজিক্যাল দোকান', desc: 'প্রকৃত দোকান/অফিস। ট্রেড লাইসেন্স প্রয়োজন।' }, { k: 'online', icon: '🌐', title: 'অনলাইন ব্যবসা', desc: 'Facebook Page, Website বা অনলাইন প্ল্যাটফর্মে বিক্রয়।' }].map(o => (
            <div key={o.k} onClick={() => { setBizType(o.k); setError(''); }}
              style={{ border: `2px solid ${bizType === o.k ? '#0F4C81' : '#E8EDF5'}`, borderRadius: '14px', padding: '14px', marginBottom: '10px', cursor: 'pointer', background: bizType === o.k ? '#EBF2FF' : 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px' }}>{o.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#141D28' }}>{o.title}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#8A9AB5' }}>{o.desc}</p>
                </div>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${bizType === o.k ? '#0F4C81' : '#DDE4EE'}`, background: bizType === o.k ? '#0F4C81' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {bizType === o.k && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }} />}
                </div>
              </div>
            </div>
          ))}
        </>}

        {/* STEP 1 */}
        {step === 1 && <>
          <h2 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: '800', color: '#141D28' }}>মালিকের তথ্য</h2>
          <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#8A9AB5' }}>* চিহ্নিত ঘরগুলো অবশ্যই পূরণ করুন</p>
          <div style={wrap}>
            <label style={lbl}>পূর্ণ নাম{req}</label>
            <input style={inp} placeholder="আপনার পূর্ণ নাম" value={owner.fullName} onChange={e => updOwner('fullName', e.target.value)} />
          </div>
          <div style={wrap}>
            <label style={lbl}>মোবাইল নম্বর (বাংলাদেশ){req}</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#5E6E8A', fontWeight: '600', pointerEvents: 'none', zIndex: 1 }}>🇧🇩 +88</span>
              <input style={{ ...inp, paddingLeft: '80px' }} placeholder="01XXXXXXXXX" value={owner.phone} onChange={e => updOwner('phone', e.target.value)} type="tel" maxLength={11} />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#8A9AB5' }}>বাংলাদেশী নম্বর: 01XXXXXXXXX (11 সংখ্যা)</p>
          </div>
          <div style={wrap}>
            <label style={lbl}>ইমেইল (ঐচ্ছিক)</label>
            <input style={inp} placeholder="email@example.com" value={owner.email} onChange={e => updOwner('email', e.target.value)} type="email" />
          </div>
          <div style={wrap}>
            <label style={lbl}>পাসওয়ার্ড{req}</label>
            <input style={inp} type="password" placeholder="কমপক্ষে ৮ অক্ষর" value={owner.password} onChange={e => updOwner('password', e.target.value)} />
          </div>
          <div style={wrap}>
            <label style={lbl}>পাসওয়ার্ড নিশ্চিত{req}</label>
            <input style={inp} type="password" placeholder="আবার লিখুন" value={owner.confirmPass} onChange={e => updOwner('confirmPass', e.target.value)} />
          </div>
          <div style={wrap}>
            <label style={lbl}>NID নম্বর (ঐচ্ছিক)</label>
            <input style={inp} placeholder="জাতীয় পরিচয়পত্র নম্বর" value={owner.nidNumber} onChange={e => updOwner('nidNumber', e.target.value)} />
          </div>
        </>}

        {/* STEP 2 */}
        {step === 2 && <>
          <h2 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: '800', color: '#141D28' }}>
            {bizType === 'physical' ? '🏪 দোকানের তথ্য' : '🌐 অনলাইন ব্যবসার তথ্য'}
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#8A9AB5' }}>* চিহ্নিত ঘরগুলো অবশ্যই পূরণ করুন</p>

          <div style={wrap}>
            <label style={lbl}>ব্যবসার নাম{req}</label>
            <input style={inp} placeholder="দোকান/ব্যবসার নাম" value={shop.shopName} onChange={e => updShop('shopName', e.target.value)} />
          </div>

          {/* বিভাগ */}
          <div style={wrap}>
            <label style={lbl}>বিভাগ{req}</label>
            <select style={inp} value={shop.division} onChange={e => handleDivisionChange(e.target.value)}>
              <option value="">-- বিভাগ বাছুন --</option>
              {BD_DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* জেলা */}
          {shop.division && (
            <div style={wrap}>
              <label style={lbl}>জেলা{req}</label>
              <select style={inp} value={shop.district} onChange={e => handleDistrictChange(e.target.value)}>
                <option value="">-- জেলা বাছুন --</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          {/* উপজেলা */}
          {shop.district && upazilas.length > 0 && (
            <div style={wrap}>
              <label style={lbl}>উপজেলা / থানা{req}</label>
              <select style={inp} value={shop.upazila} onChange={e => updShop('upazila', e.target.value)}>
                <option value="">-- উপজেলা বাছুন --</option>
                {upazilas.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          )}

          {/* থানা */}
          {shop.upazila && (
            <div style={wrap}>
              <label style={lbl}>থানা (ঐচ্ছিক)</label>
              <input style={inp} placeholder="থানার নাম লিখুন" value={shop.thana} onChange={e => updShop('thana', e.target.value)} />
            </div>
          )}

          {/* পোস্ট কোড */}
          <div style={wrap}>
            <label style={lbl}>পোস্ট কোড</label>
            <input style={inp} placeholder="পোস্ট কোড (স্বয়ংক্রিয়ভাবে পূরণ হতে পারে)" value={shop.postCode} onChange={e => updShop('postCode', e.target.value)} />
          </div>

          {/* ঠিকানা ও লাইভ লোকেশন */}
          <div style={wrap}>
            <label style={lbl}>সম্পূর্ণ ঠিকানা{req}</label>
            <textarea style={{ ...inp, minHeight: '70px', resize: 'vertical' }}
              placeholder="বাড়ি নং, রোড নং, এলাকার নাম..." value={shop.address} onChange={e => updShop('address', e.target.value)} />
          </div>

          {/* লাইভ লোকেশন / Google Map */}
          <div style={{ background: '#F0F9FF', border: '2px solid #BAE6FD', borderRadius: '14px', padding: '14px', marginBottom: '14px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#0369A1' }}>📍 Google Map লোকেশন (ঐচ্ছিক)</p>
            {mapLocation && (
              <div style={{ background: 'white', borderRadius: '10px', padding: '10px', marginBottom: '10px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#0BAA69', fontWeight: '600' }}>✅ লোকেশন সংরক্ষিত</p>
                <p style={{ margin: '3px 0', fontSize: '11px', color: '#5E6E8A' }}>Lat: {mapLocation.lat.toFixed(5)}, Lng: {mapLocation.lng.toFixed(5)}</p>
                <a href={`https://www.google.com/maps?q=${mapLocation.lat},${mapLocation.lng}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: '11px', color: '#0F4C81', fontWeight: '600', textDecoration: 'none' }}>🗺️ Google Maps-এ দেখুন →</a>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={getCurrentLocation} disabled={gettingLocation}
                style={{ flex: 1, padding: '10px', background: gettingLocation ? '#E8EDF5' : '#0F4C81', color: gettingLocation ? '#8A9AB5' : 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: gettingLocation ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {gettingLocation ? '⏳ লোকেশন নিচ্ছে...' : '📡 আমার লোকেশন নিন'}
              </button>
              <a href="https://www.google.com/maps" target="_blank" rel="noreferrer"
                style={{ flex: 1, padding: '10px', background: '#EBF2FF', color: '#0F4C81', border: '1px solid #BAE6FD', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🗺️ Google Maps খুলুন
              </a>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#5E6E8A' }}>লোকেশন যুক্ত করলে গ্রাহকরা সহজে আপনাকে খুঁজে পাবেন</p>
          </div>

          <div style={wrap}>
            <label style={lbl}>যোগাযোগ নম্বর</label>
            <input style={inp} placeholder="দোকানের ফোন নম্বর" value={shop.shopPhone} onChange={e => updShop('shopPhone', e.target.value)} />
          </div>

          {bizType === 'physical' && <>
            <div style={wrap}>
              <label style={lbl}>ট্রেড লাইসেন্স নম্বর{req}</label>
              <input style={inp} placeholder="Trade License No." value={shop.tradeLicense} onChange={e => updShop('tradeLicense', e.target.value)} />
            </div>
            <div style={wrap}>
              <label style={lbl}>দোকানের ছবি{req} <span style={{ fontWeight: '400', color: '#8A9AB5' }}>(অন্তত ১টি, সর্বোচ্চ ৫টি)</span></label>
              <div style={{ border: `2px dashed ${photos.length === 0 ? '#E63946' : '#DDE4EE'}`, borderRadius: '12px', padding: '14px', textAlign: 'center', background: photos.length === 0 ? '#FFF5F5' : '#FAFBFC' }}>
                {photos.length < 5 && (
                  <label style={{ cursor: 'pointer', display: 'block' }}>
                    <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} />
                    <span style={{ fontSize: '28px' }}>📷</span>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#5E6E8A' }}>ছবি বাছুন ({photos.length}/5)</p>
                  </label>
                )}
                {photos.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', justifyContent: 'center' }}>
                    {photos.map((p, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={p} alt="" style={{ width: '65px', height: '65px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #EEF2F7' }} />
                        <button type="button" onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                          style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#E63946', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>}

          {bizType === 'online' && <>
            <div style={wrap}>
              <label style={lbl}>Facebook Page URL{req}</label>
              <input style={inp} placeholder="https://facebook.com/yourpage" value={shop.fbPageUrl} onChange={e => updShop('fbPageUrl', e.target.value)} />
            </div>
            <div style={wrap}>
              <label style={lbl}>Website URL (ঐচ্ছিক)</label>
              <input style={inp} placeholder="https://yoursite.com" value={shop.websiteUrl} onChange={e => updShop('websiteUrl', e.target.value)} />
            </div>
            <div style={{ background: '#EBF2FF', borderRadius: '12px', padding: '12px', marginBottom: '14px' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0F4C81' }}>ℹ️ অনলাইন যাচাইকরণ</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#5E6E8A' }}>একাউন্ট তৈরির পর একটি যাচাই কোড পাবেন। Facebook About বা Website-এ যুক্ত করুন।</p>
            </div>
            <div style={wrap}>
              <label style={lbl}>ব্যবসার ছবি (সর্বোচ্চ ৫টি, ঐচ্ছিক)</label>
              <div style={{ border: '2px dashed #DDE4EE', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <label style={{ cursor: 'pointer' }}>
                  <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} />
                  <span style={{ fontSize: '24px' }}>📷</span>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#5E6E8A' }}>ছবি যোগ করুন ({photos.length}/5)</p>
                </label>
                {photos.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px', justifyContent: 'center' }}>
                    {photos.map((p, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={p} alt="" style={{ width: '55px', height: '55px', objectFit: 'cover', borderRadius: '8px' }} />
                        <button type="button" onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                          style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#E63946', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>}
        </>}

        {/* STEP 3 — Verification */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', background: '#EBF2FF', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '36px' }}>🔐</div>
            <h2 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: '800', color: '#141D28' }}>যাচাইকরণ কোড</h2>
            <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#8A9AB5' }}>আপনার অনলাইন ব্যবসা যাচাই করতে এই কোড ব্যবহার করুন</p>
            <div style={{ background: '#EBF2FF', borderRadius: '14px', padding: '18px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#5E6E8A' }}>আপনার ভেরিফিকেশন কোড:</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0F4C81', letterSpacing: '2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{verificationCode}</p>
            </div>
            <div style={{ background: '#F0FDF4', borderRadius: '12px', padding: '14px', textAlign: 'left', marginBottom: '18px' }}>
              <p style={{ margin: '0 0 8px', fontWeight: '700', fontSize: '13px', color: '#065F46' }}>📋 কিভাবে যাচাই করবেন:</p>
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#047857' }}>📘 Facebook: Page-এর About-এ কোড লিখুন</p>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#047857' }}>🌐 Website: এই meta tag যুক্ত করুন:</p>
              <code style={{ display: 'block', background: 'white', padding: '8px 10px', borderRadius: '8px', fontSize: '11px', color: '#0F4C81', border: '1px solid #A7F3D0', wordBreak: 'break-all' }}>
                {'<meta name="digiboi-verification" content="' + verificationCode + '" />'}
              </code>
            </div>
            <button type="button" onClick={() => router.push('/dashboard')}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              ড্যাশবোর্ডে যান →
            </button>
          </div>
        )}

        {step < 3 && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            {step > 0 && <button type="button" onClick={() => { setStep(s => s - 1); setError(''); }}
              style={{ flex: 1, padding: '13px', border: '2px solid #DDE4EE', borderRadius: '12px', background: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#5E6E8A', fontFamily: 'inherit' }}>← আগে</button>}
            {step < 2
              ? <button type="button" onClick={goNext}
                  style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg,#0F4C81,#2E86DE)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>পরবর্তী →</button>
              : <button type="button" onClick={handleSubmit} disabled={loading}
                  style={{ flex: 2, padding: '13px', background: loading ? '#6B9CD8' : 'linear-gradient(135deg,#0BAA69,#059669)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {loading ? '⏳ তৈরি হচ্ছে...' : '✅ একাউন্ট তৈরি করুন'}
                </button>
            }
          </div>
        )}

        {step === 0 && (
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#8A9AB5' }}>
            আগে থেকে একাউন্ট আছে?{' '}
            <Link href="/auth/login" style={{ color: '#0F4C81', fontWeight: '700', textDecoration: 'none' }}>লগইন করুন</Link>
          </p>
        )}
      </div>
      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '20px' }}>© 2025 Digiboi — শুধুমাত্র বাংলাদেশের জন্য 🇧🇩</p>
    </div>
  );
}
