const URL=process.env.SUPABASE_URL;
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 if(!URL||!KEY)return res.status(503).json({error:'Leaderboard is not connected yet',configured:false});
 try{
  const endpoint=`${URL}/rest/v1/nothing_scores?select=display_name,score,created_at&order=score.desc,created_at.asc&limit=100`;
  const r=await fetch(endpoint,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
  if(!r.ok)throw Error(`Leaderboard query failed (${r.status})`);
  const scores=await r.json();
  res.status(200).json({configured:true,top:scores.map((s,i)=>({rank:i+1,name:s.display_name,score:s.score})),cutoff:scores.length===100?scores[99].score:null,entries:scores.length});
 }catch(e){res.status(502).json({error:'Leaderboard temporarily unavailable'});}
}
