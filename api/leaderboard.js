export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try{
  const response=await fetch('https://scgihelnwihjckzzvxyc.supabase.co/functions/v1/nothing-game?action=leaderboard',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error('Leaderboard unavailable');
  return res.status(200).json(await response.json());
 }catch{return res.status(503).json({error:'Leaderboard temporarily unavailable'});}
}
