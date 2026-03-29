import { Metadata } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'
import PublicProductClient from './client'

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  return { title: `পণ্য তথ্য | Digiboi` }
}

export default async function PublicProductPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code)
  let product = null
  try {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
      .from('inventory')
      .select('id, name, category, sell_price, unit, status, image_url, notes, product_link')
      .eq('product_link', code)
      .neq('status', 'Archived')
      .single()
    product = data
  } catch {}

  return <PublicProductClient product={product} code={code} />
}
