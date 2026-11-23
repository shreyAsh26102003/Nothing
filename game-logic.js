export function difficulty(elapsed){
 const t=Math.max(0,Math.min(45,elapsed));
 if(t<10)return {interval:1.05,count:1,bombChance:.08};
 if(t<22)return {interval:.88,count:2,bombChance:.17};
 if(t<34)return {interval:.76,count:2,bombChance:.28};
 return {interval:.64,count:3,bombChance:.40};
}
export function shareText(score,url){const safe=Math.max(0,Math.floor(Number(score)||0));return `I scored ${safe} playing Nothing.\nThink you can beat that?\n${url}`}
