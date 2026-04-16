#!/bin/bash
# Apply type casts using sed for efficiency

file="app/insurance/page.tsx"

# msg.message inside <p> or </p> tags - needs special handling due to both && and direct usage
sed -i 's/{msg\.message && <p className="text-sm text-gray-700">/{(msg.message as string) \&\& <p className="text-sm text-gray-700">/g' "$file"
sed -i 's/{msg\.message}<\/p>}/{msg.message as string}<\/p>}/g' "$file"

# msg.suggestions && - outer cast
sed -i 's/{msg\.suggestions && (/{(msg.suggestions as string[]) \&\& (/g' "$file"

# msg.client && - outer cast
sed -i 's/{msg\.client && (/{(msg.client as Record<string, unknown>) \&\& (/g' "$file"

# msg.gapAnalysis && - outer cast
sed -i 's/{msg\.gapAnalysis && (/{(msg.gapAnalysis as Record<string, unknown>) \&\& (/g' "$file"

# msg.newGap && - outer cast
sed -i 's/{msg\.newGap && (/{(msg.newGap as Record<string, unknown>) \&\& (/g' "$file"

# msg.gap && - outer cast
sed -i 's/{msg\.gap && (/{(msg.gap as Record<string, unknown>) \&\& (/g' "$file"

# msg.products && renderProducts - outer cast
sed -i 's/{msg\.products && renderProducts(msg\.products/{(msg.products as Array<{ rank: number; product: Product; advisorNote?: string }>) \&\& renderProducts(msg.products/g' "$file"

# msg.table && renderTable - outer cast
sed -i 's/msg\.table && renderTable(msg\.table\.headers/(msg.table as { headers: string[]; rows: string[][] }) \&\& renderTable((msg.table as { headers: string[]; rows: string[][] }).headers/g' "$file"
sed -i 's/msg\.table\.rows/(msg.table as { headers: string[]; rows: string[][] }).rows/g' "$file"

# msg.providers length check
sed -i "s/msg\.providers?\.length === 0/(msg.providers as Array<unknown>)?\.length === 0/g" "$file"

# msg.schedule && renderTable - outer cast
sed -i 's/msg\.schedule && renderTable(/msg.schedule as Array<{ year: number; cumulative: number; guaranteed: number; projected: number }>) \&\& renderTable(/g' "$file"

# msg.chartData && renderIllustrationChart
sed -i 's/msg\.chartData && renderIllustrationChart/(msg.chartData as { labels: string[]; guaranteed: number[]; projected: number[]; cumulative: number[] }) \&\& renderIllustrationChart/g' "$file"

# msg.key_terms && <ul> - outer cast
sed -i 's/{msg\.key_terms && <ul/{(msg.key_terms as string[]) \&\& <ul/g' "$file"

# msg.conditions && <ul> - outer cast
sed -i 's/{msg\.conditions && <ul/{(msg.conditions as string[]) \&\& <ul/g' "$file"

# msg.notes && - outer cast
sed -i 's/{msg\.notes && (/(msg.notes as string[]) \&\& (/g' "$file"
sed -i 's/{msg\.notes && <ul/{(msg.notes as string[]) \&\& <ul/g' "$file"

# msg.breakeven && - outer cast
sed -i 's/{msg\.breakeven && <p/{(msg.breakeven as string) \&\& <p/g' "$file"

# msg.max_years && - outer cast
sed -i 's/{msg\.max_years && <span/{(msg.max_years as string) \&\& <span/g' "$file"

# msg.max_coverage_age && - outer cast
sed -i 's/{msg\.max_coverage_age && <span/{(msg.max_coverage_age as string) \&\& <span/g' "$file"

# msg.year && - outer cast
sed -i 's/{msg\.year && <div/{(msg.year as string) \&\& <div/g' "$file"

# msg.claim_process && - outer cast
sed -i 's/{msg\.claim_process && <div/{(msg.claim_process as string) \&\& <div/g' "$file"

# msg.response && - outer cast
sed -i 's/{msg\.response && <p/{(msg.response as string) \&\& <p/g' "$file"

# msg.products?.length > 0
sed -i 's/msg\.products?\.length > 0/(msg.products as Array<{ rank: number; product: Product; advisorNote?: string }>)?.length > 0/g' "$file"

# msg.role comparison
sed -i "s/msg\.role === 'user'/(msg.role as string) === 'user'/g" "$file"

# Direct {msg.message} usages (no &&)
sed -i 's/{msg\.message}<\/p>}/{msg.message as string}<\/p>}/g' "$file"

echo "All sed replacements done"
