import fs from 'fs'
import path from 'path'

// Simple script to generate a valid PDF 1.4 document for Musfiqur Rahim
function generateResumePdf() {
  const content = [
    'BT',
    '/F1 22 Tf',
    '50 740 Td',
    '(MUSFIQUR RAHIM) Tj',
    '/F1 12 Tf',
    '0 -24 Td',
    '(Frontend Developer - React.js & MERN Stack) Tj',
    '/F1 10 Tf',
    '0 -18 Td',
    '(Dhaka, Bangladesh | devmusfiqurrahimofficial@gmail.com | github.com/devmusfiqurrahimofficial) Tj',
    '0 -24 Td',
    '(----------------------------------------------------------------------------------------------------------------) Tj',
    '/F1 14 Tf',
    '0 -22 Td',
    '(SUMMARY) Tj',
    '/F1 10 Tf',
    '0 -16 Td',
    '(Frontend Developer at UIUXHero building modern, responsive, high-performance web applications) Tj',
    '0 -14 Td',
    '(with React.js, Next.js, TypeScript and Tailwind CSS. Growing into full-stack with the MERN stack.) Tj',
    '0 -14 Td',
    '(Studying B.Sc. in Computer Science & Engineering at East West University. Certified Web Professional (CWP).) Tj',
    '/F1 14 Tf',
    '0 -24 Td',
    '(TECHNICAL SKILLS) Tj',
    '/F1 10 Tf',
    '0 -16 Td',
    '(Frontend: React 19, Next.js 15, TypeScript, JavaScript (ES6+), Redux Toolkit, Tailwind CSS, HTML5, CSS3) Tj',
    '0 -14 Td',
    '(Backend & Database: Node.js, Express.js, MongoDB, REST APIs, JWT, Firebase Authentication) Tj',
    '0 -14 Td',
    '(Tools & Deployment: Git, GitHub, Postman, Figma, Shopify, Vercel, Netlify) Tj',
    '/F1 14 Tf',
    '0 -24 Td',
    '(FEATURED PROJECTS) Tj',
    '/F1 11 Tf',
    '0 -16 Td',
    '(1. Caffeine Lab - MERN Coffee Store & Management System) Tj',
    '/F1 9 Tf',
    '0 -13 Td',
    '(   Full-stack MERN e-commerce app with product catalogue, cart, checkout with PDF invoices, and admin dashboard.) Tj',
    '/F1 11 Tf',
    '0 -18 Td',
    '(2. UIUXHero - Agency Website) Tj',
    '/F1 9 Tf',
    '0 -13 Td',
    '(   Responsive agency website with clean layouts, optimized SEO, and fluid animations using Next.js & Tailwind.) Tj',
    '/F1 11 Tf',
    '0 -18 Td',
    '(3. De Studio Home - Shopify Storefront) Tj',
    '/F1 9 Tf',
    '0 -13 Td',
    '(   Customised Shopify store for UAE home decor brand with bespoke Liquid components and responsive layouts.) Tj',
    '/F1 11 Tf',
    '0 -18 Td',
    '(4. Coffee House - React SPA) Tj',
    '/F1 9 Tf',
    '0 -13 Td',
    '(   Single-page coffee shop application featuring Firebase Auth, dynamic filtering, and client-side routing.) Tj',
    '/F1 14 Tf',
    '0 -24 Td',
    '(EDUCATION & CERTIFICATIONS) Tj',
    '/F1 10 Tf',
    '0 -16 Td',
    '(B.Sc. in Computer Science & Engineering - East West University (Ongoing)) Tj',
    '0 -14 Td',
    '(Certified Web Professional (CWP) - CodersTrust Bangladesh) Tj',
    'ET',
  ].join('\n')

  const stream = Buffer.from(content, 'utf-8')

  const objects = [
    // 1: Catalog
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    // 2: Pages
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    // 3: Page
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj',
    // 4: Stream
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${content}\nendstream\nendobj`,
    // 5: Font
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
  ]

  let offset = 9 // '%PDF-1.4\n'
  const xref = ['xref', '0 6', '0000000000 65535 f ']
  for (const obj of objects) {
    xref.push(String(offset).padStart(10, '0') + ' 00000 n ')
    offset += Buffer.byteLength(obj, 'utf-8') + 1 // + '\n'
  }

  const xrefOffset = offset
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const pdf = `%PDF-1.4\n${objects.join('\n')}\n${xref.join('\n')}\n${trailer}`
  fs.writeFileSync(path.join(process.cwd(), 'public', 'resume.pdf'), Buffer.from(pdf, 'utf-8'))
  console.log('Successfully generated public/resume.pdf')
}

generateResumePdf()
