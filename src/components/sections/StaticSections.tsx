'use client'
import { Shield, HelpCircle, Lock, AlertTriangle, FileText, ChevronRight } from 'lucide-react'

function StaticPage({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card card-p anim-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
          <div className="section-title">{title}</div>
        </div>
        <div style={{ color: 'var(--text2)', fontSize: '0.82rem', lineHeight: 1.8, fontFamily: 'var(--font-bn)' }}>{children}</div>
      </div>
    </div>
  )
}

export function SecuritySection() {
  return (
    <StaticPage icon={<Shield size={22} />} title="নিরাপত্তা">
      <p>আপনার ডেটা সুরক্ষিত রাখতে আমরা প্রতিশ্রুতিবদ্ধ।</p>
      <br />
      <p>• সকল ডেটা এনক্রিপ্টেড আকারে সংরক্ষিত</p>
      <p>• Supabase এর মাধ্যমে নিরাপদ ক্লাউড স্টোরেজ</p>
      <p>• JWT টোকেন ভিত্তিক প্রমাণীকরণ</p>
      <p>• প্রতিটি অ্যাকাউন্ট সম্পূর্ণ আলাদা এবং সুরক্ষিত</p>
      <br />
      <p>নিরাপত্তা সংক্রান্ত যেকোনো সমস্যায় আমাদের সাথে যোগাযোগ করুন।</p>
    </StaticPage>
  )
}

export function HelpSection() {
  const items = [
    { q: 'কীভাবে পণ্য যোগ করব?', a: 'ইনভেন্টরি সেকশনে গিয়ে "যোগ করুন" বোতামে ক্লিক করুন।' },
    { q: 'কীভাবে বিক্রয় রেকর্ড করব?', a: 'লেনদেন সেকশনে গিয়ে পণ্য নির্বাচন করে বিক্রয় করুন।' },
    { q: 'বকেয়া কীভাবে ট্র্যাক করব?', a: 'বকেয়া সেকশনে গিয়ে নতুন বকেয়া যোগ করুন।' },
    { q: 'রিপোর্ট কীভাবে ডাউনলোড করব?', a: 'রিপোর্ট সেকশনে CSV বোতামে ক্লিক করুন।' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card card-p anim-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HelpCircle size={22} /></div>
          <div className="section-title">সাহায্য ও নির্দেশিকা</div>
        </div>
        {items.map((item, i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', fontFamily: 'var(--font-bn)', marginBottom: 4 }}>❓ {item.q}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text2)', fontFamily: 'var(--font-bn)', lineHeight: 1.6 }}>→ {item.a}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PrivacySection() {
  return (
    <StaticPage icon={<Lock size={22} />} title="গোপনীয়তা নীতি">
      <p>আপনার ব্যক্তিগত তথ্য সুরক্ষা আমাদের সর্বোচ্চ অগ্রাধিকার।</p>
      <br />
      <p><strong>তথ্য সংগ্রহ:</strong> আমরা শুধুমাত্র ব্যবসা পরিচালনার জন্য প্রয়োজনীয় তথ্য সংগ্রহ করি।</p>
      <br />
      <p><strong>তথ্য ব্যবহার:</strong> আপনার তথ্য তৃতীয় পক্ষের সাথে শেয়ার করা হয় না।</p>
      <br />
      <p><strong>তথ্য সুরক্ষা:</strong> সকল ডেটা এনক্রিপ্টেড এবং নিরাপদ সার্ভারে সংরক্ষিত।</p>
      <br />
      <p><strong>তথ্য মুছে ফেলা:</strong> আপনি যেকোনো সময় আপনার অ্যাকাউন্ট এবং সকল ডেটা মুছে ফেলতে পারবেন।</p>
    </StaticPage>
  )
}

export function DisclaimerSection() {
  return (
    <StaticPage icon={<AlertTriangle size={22} />} title="দাবিত্যাগ">
      <p>Digiboi একটি ব্যবসা ব্যবস্থাপনা সফটওয়্যার। এই সফটওয়্যার ব্যবহারের ক্ষেত্রে নিম্নলিখিত বিষয়গুলো বিবেচনা করুন:</p>
      <br />
      <p>• এই সফটওয়্যারটি পেশাদার আর্থিক পরামর্শের বিকল্প নয়।</p>
      <p>• ব্যবহারকারী নিজেই তাদের ব্যবসায়িক সিদ্ধান্তের জন্য দায়ী।</p>
      <p>• প্রযুক্তিগত সমস্যার কারণে ডেটা হারানোর ক্ষেত্রে আমরা দায়ী নই।</p>
      <p>• নিয়মিত ব্যাকআপ রাখার পরামর্শ দেওয়া হয়।</p>
    </StaticPage>
  )
}

export function TermsSection() {
  return (
    <StaticPage icon={<FileText size={22} />} title="ব্যবহারের শর্তাবলী">
      <p><strong>১. সেবা গ্রহণ:</strong> Digiboi ব্যবহার করে আপনি এই শর্তাবলীতে সম্মত হচ্ছেন।</p>
      <br />
      <p><strong>২. অ্যাকাউন্ট:</strong> আপনার অ্যাকাউন্টের নিরাপত্তা বজায় রাখা আপনার দায়িত্ব।</p>
      <br />
      <p><strong>৩. ডেটা:</strong> আপনার ব্যবসায়িক ডেটার মালিকানা আপনার।</p>
      <br />
      <p><strong>৪. ব্যবহার:</strong> এই সফটওয়্যার শুধুমাত্র বৈধ ব্যবসায়িক উদ্দেশ্যে ব্যবহার করুন।</p>
      <br />
      <p><strong>৫. পরিবর্তন:</strong> আমরা যেকোনো সময় এই শর্তাবলী পরিবর্তন করার অধিকার রাখি।</p>
    </StaticPage>
  )
}
