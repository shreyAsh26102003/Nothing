// Browser scores are untrusted. Do not accept them as official until server-side validation is implemented.
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');res.status(503).json({error:'Official score submissions are not open yet.'});}
