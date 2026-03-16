import { useState, useEffect } from "react";

const BADGES = [
  { id: "first_day", label: "First Step", desc: "Complete 1 clean day", icon: "🌱", req: 1 },
  { id: "three_days", label: "Triceps of Steel", desc: "3 clean days in a row", icon: "💪", req: 3 },
  { id: "week", label: "Week Warrior", desc: "7 clean days in a row", icon: "🔥", req: 7 },
  { id: "two_weeks", label: "Fortnight Knight", desc: "14 clean days in a row", icon: "⚔️", req: 14 },
  { id: "month", label: "Monthly Master", desc: "30 clean days in a row", icon: "👑", req: 30 },
  { id: "hundred", label: "Century Legend", desc: "100 clean days in a row", icon: "🏆", req: 100 },
];

const LEAGUE_TIERS = [
  { name: "Bronze", icon: "🥉", min: 0 },
  { name: "Silver", icon: "🥈", min: 50 },
  { name: "Gold", icon: "🥇", min: 150 },
  { name: "Platinum", icon: "💎", min: 350 },
  { name: "Diamond", icon: "💠", min: 700 },
];

const ENCOURAGEMENTS = [
  "Ogni giorno conta! 🙌","Stay clean, stay strong!","You're doing great!",
  "Keep the streak alive! 🔥","Words have power — use them well.","Chi la dura la vince!",
];

const XP_PER_CLEAN_DAY = 20;
const XP_PENALTY = 15;

function getLeague(xp: number) {
  let tier = LEAGUE_TIERS[0];
  for (const t of LEAGUE_TIERS) { if (xp >= t.min) tier = t; }
  return tier;
}
function getNextLeague(xp: number) {
  for (let i = LEAGUE_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LEAGUE_TIERS[i].min) return LEAGUE_TIERS[i + 1] || null;
  }
  return LEAGUE_TIERS[1];
}

const defaultState = { streak:0,xp:0,totalCleanDays:0,slips:0,lastCheckin:null as string|null,history:[] as {date:string,clean:boolean}[],earnedBadges:[] as string[] };

const STORAGE_KEY = "cleanstreak_state";

export default function App() {
  const [state, setState] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : defaultState; } catch { return defaultState; }
  });
  const [view, setView] = useState("home");
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState<typeof BADGES[0]|null>(null);
  const [showXPPop, setShowXPPop] = useState<string|null>(null);
  const [todayDone, setTodayDone] = useState(false);
  const [encouragement] = useState(() => ENCOURAGEMENTS[Math.floor(Math.random()*ENCOURAGEMENTS.length)]);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setTodayDone(state.lastCheckin === today);
  }, [state, today]);

  function addXP(amount: number) {
    setShowXPPop(amount > 0 ? `+${amount} XP` : `${amount} XP`);
    setTimeout(() => setShowXPPop(null), 1800);
  }

  function checkNewBadges(s: typeof defaultState) {
    const earned = BADGES.filter(b => !s.earnedBadges.includes(b.id) && s.streak >= b.req);
    if (earned.length > 0) { s.earnedBadges = [...s.earnedBadges, ...earned.map(b=>b.id)]; setTimeout(()=>setShowRewardModal(earned[0]),400); }
    return s;
  }

  function handleCleanDay() {
    if (todayDone) return;
    setState((prev: typeof defaultState) => {
      let s = {...prev};
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
      const yStr = yesterday.toISOString().split("T")[0];
      s.streak = (s.lastCheckin===yStr||s.lastCheckin===today) ? s.streak+1 : 1;
      s.xp += XP_PER_CLEAN_DAY; s.totalCleanDays += 1; s.lastCheckin = today;
      s.history = [...s.history.slice(-29),{date:today,clean:true}];
      return checkNewBadges(s);
    });
    addXP(XP_PER_CLEAN_DAY); setTodayDone(true);
  }

  function handleSlip() {
    setState((prev: typeof defaultState) => {
      let s = {...prev};
      s.streak=0; s.xp=Math.max(0,s.xp-XP_PENALTY); s.slips+=1; s.lastCheckin=today;
      s.history=[...s.history.slice(-29),{date:today,clean:false}];
      return s;
    });
    addXP(-XP_PENALTY); setShowSlipModal(false); setTodayDone(true);
  }

  function resetAll() { setState(defaultState); localStorage.removeItem(STORAGE_KEY); setTodayDone(false); }

  const league = getLeague(state.xp);
  const nextLeague = getNextLeague(state.xp);
  const xpForNext = nextLeague ? nextLeague.min : null;
  const xpProgress = xpForNext ? Math.min(100,Math.round(((state.xp-league.min)/(xpForNext-league.min))*100)) : 100;
  const weekHistory = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); const key=d.toISOString().split("T")[0]; return {key,entry:state.history.find((h: {date:string,clean:boolean})=>h.date===key)}; });

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)",fontFamily:"'Segoe UI',sans-serif",color:"#fff",display:"flex",flexDirection:"column",alignItems:"center",padding:"0 0 80px 0",position:"relative",overflowX:"hidden"}}>
      {showXPPop&&<div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",background:showXPPop.startsWith("+")?"#58cc02":"#ff4b4b",color:"#fff",fontWeight:900,fontSize:22,borderRadius:30,padding:"10px 28px",zIndex:999,boxShadow:"0 4px 20px rgba(0,0,0,0.4)",animation:"fadeUp 1.8s ease forwards"}}>{showXPPop}</div>}
      {showRewardModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"#1e293b",borderRadius:24,padding:"40px 32px",textAlign:"center",maxWidth:300,border:"2px solid #ffd700",boxShadow:"0 0 40px #ffd70066"}}><div style={{fontSize:70}}>{showRewardModal.icon}</div><div style={{fontSize:11,letterSpacing:3,color:"#ffd700",marginTop:8,fontWeight:700}}>NEW BADGE UNLOCKED</div><div style={{fontSize:22,fontWeight:900,marginTop:6}}>{showRewardModal.label}</div><div style={{color:"#94a3b8",marginTop:6}}>{showRewardModal.desc}</div><button onClick={()=>setShowRewardModal(null)} style={{marginTop:24,background:"#ffd700",color:"#1a1a2e",border:"none",borderRadius:14,padding:"12px 32px",fontWeight:900,fontSize:15,cursor:"pointer"}}>CLAIM 🎉</button></div></div>}
      {showSlipModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"#1e293b",borderRadius:24,padding:"36px 28px",textAlign:"center",maxWidth:300,border:"2px solid #ff4b4b"}}><div style={{fontSize:50}}>💀</div><div style={{fontSize:20,fontWeight:900,marginTop:8}}>Report a Slip?</div><div style={{color:"#94a3b8",marginTop:8,fontSize:14}}>This will reset your streak and cost you <span style={{color:"#ff4b4b",fontWeight:700}}>−{XP_PENALTY} XP</span>.</div><div style={{display:"flex",gap:10,marginTop:24,justifyContent:"center"}}><button onClick={()=>setShowSlipModal(false)} style={{background:"#334155",color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={handleSlip} style={{background:"#ff4b4b",color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",cursor:"pointer",fontWeight:700}}>I Slipped</button></div></div></div>}
      <div style={{width:"100%",maxWidth:420,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px 10px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:26}}>{league.icon}</span><span style={{fontWeight:800,fontSize:15,color:"#ffd700"}}>{league.name}</span></div><div style={{fontWeight:900,fontSize:20,letterSpacing:1,color:"#58cc02"}}>CleanStreak</div><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:18}}>⚡</span><span style={{fontWeight:800,color:"#ffd700"}}>{state.xp} XP</span></div></div>
      <div style={{width:"100%",maxWidth:420,padding:"0 20px 6px"}}><div style={{height:8,background:"#1e293b",borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:`${xpProgress}%`,background:"linear-gradient(90deg,#58cc02,#89e219)",borderRadius:20,transition:"width 0.6s ease"}}/></div>{nextLeague&&<div style={{fontSize:11,color:"#64748b",textAlign:"right",marginTop:2}}>{state.xp}/{xpForNext} XP → {nextLeague.icon} {nextLeague.name}</div>}</div>
      <div style={{display:"flex",gap:4,padding:"10px 20px",width:"100%",maxWidth:420}}>{[["home","🏠"],["badges","🏅"],["stats","📊"]].map(([v,icon])=><button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"10px 0",background:view===v?"#58cc02":"#1e293b",color:view===v?"#fff":"#64748b",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer"}}>{icon} {v.charAt(0).toUpperCase()+v.slice(1)}</button>)}</div>
      {view==="home"&&<div style={{width:"100%",maxWidth:420,padding:"0 20px",display:"flex",flexDirection:"column",gap:16}}><div style={{background:"linear-gradient(135deg,#ff9500,#ff6a00)",borderRadius:20,padding:"28px 24px",textAlign:"center",boxShadow:"0 8px 30px rgba(255,106,0,0.4)"}}><div style={{fontSize:60}}>🔥</div><div style={{fontSize:58,fontWeight:900,lineHeight:1}}>{state.streak}</div><div style={{fontSize:16,fontWeight:700,opacity:0.9}}>day streak</div><div style={{fontSize:13,opacity:0.75,marginTop:6}}>{encouragement}</div></div><div style={{background:"#1e293b",borderRadius:16,padding:"16px",display:"flex",justifyContent:"space-between"}}>{["M","T","W","T","F","S","S"].map((d,i)=>{const entry=weekHistory[i]?.entry;return(<div key={i} style={{textAlign:"center"}}><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>{d}</div><div style={{width:34,height:34,borderRadius:10,background:entry?(entry.clean?"#58cc02":"#ff4b4b"):"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,border:weekHistory[i]?.key===today?"2px solid #ffd700":"2px solid transparent"}}>{entry?(entry.clean?"✓":"✗"):""}</div></div>);})}</div>{!todayDone?<div style={{display:"flex",flexDirection:"column",gap:10}}><button onClick={handleCleanDay} style={{background:"linear-gradient(90deg,#58cc02,#89e219)",color:"#fff",border:"none",borderRadius:16,padding:"18px",fontSize:17,fontWeight:900,cursor:"pointer",boxShadow:"0 4px 20px rgba(88,204,2,0.4)"}}>✅ I STAYED CLEAN TODAY</button><button onClick={()=>setShowSlipModal(true)} style={{background:"#1e293b",color:"#ff4b4b",border:"2px solid #ff4b4b",borderRadius:16,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer"}}>💀 Report a Slip</button></div>:<div style={{background:"#1e293b",borderRadius:16,padding:20,textAlign:"center",border:"2px solid #58cc02"}}><div style={{fontSize:32}}>✅</div><div style={{fontWeight:800,color:"#58cc02",marginTop:4}}>Today's logged!</div><div style={{color:"#64748b",fontSize:13,marginTop:4}}>Come back tomorrow to continue your streak.</div></div>}<div style={{display:"flex",gap:10}}>{[{label:"Total Clean",val:state.totalCleanDays,icon:"📅"},{label:"Total XP",val:state.xp,icon:"⚡"},{label:"Slips",val:state.slips,icon:"💀"}].map(({label,val,icon})=><div key={label} style={{flex:1,background:"#1e293b",borderRadius:14,padding:"14px 10px",textAlign:"center"}}><div style={{fontSize:22}}>{icon}</div><div style={{fontWeight:900,fontSize:20,marginTop:2}}>{val}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{label}</div></div>)}</div></div>}
      {view==="badges"&&<div style={{width:"100%",maxWidth:420,padding:"0 20px",display:"flex",flexDirection:"column",gap:12}}><div style={{fontWeight:800,fontSize:18,marginBottom:4}}>Achievements</div>{BADGES.map(b=>{const earned=state.earnedBadges.includes(b.id);return(<div key={b.id} style={{background:earned?"linear-gradient(135deg,#1e3a5f,#1e293b)":"#1e293b",borderRadius:16,padding:"16px",display:"flex",alignItems:"center",gap:14,border:earned?"2px solid #ffd700":"2px solid #334155",opacity:earned?1:0.5}}><div style={{fontSize:38,filter:earned?"none":"grayscale(1)"}}>{b.icon}</div><div style={{flex:1}}><div style={{fontWeight:800,fontSize:15}}>{b.label}</div><div style={{fontSize:12,color:"#64748b"}}>{b.desc}</div>{!earned&&<div style={{marginTop:6,height:4,background:"#334155",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,Math.round((state.streak/b.req)*100))}%`,background:"#58cc02",borderRadius:4}}/></div>}</div>{earned&&<div style={{color:"#ffd700",fontSize:20}}>⭐</div>}</div>);})}<div style={{fontWeight:800,fontSize:18,marginTop:8}}>Leagues</div>{LEAGUE_TIERS.map(t=>{const current=league.name===t.name;const past=state.xp>=t.min;return(<div key={t.name} style={{background:current?"linear-gradient(135deg,#1e3a5f,#1e293b)":"#1e293b",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,border:current?"2px solid #ffd700":"2px solid #334155",opacity:past?1:0.4}}><span style={{fontSize:28}}>{t.icon}</span><div><div style={{fontWeight:700}}>{t.name}</div><div style={{fontSize:12,color:"#64748b"}}>{t.min} XP required</div></div>{current&&<div style={{marginLeft:"auto",fontSize:12,color:"#ffd700",fontWeight:700}}>CURRENT</div>}</div>);})}</div>}
      {view==="stats"&&<div style={{width:"100%",maxWidth:420,padding:"0 20px",display:"flex",flexDirection:"column",gap:14}}><div style={{fontWeight:800,fontSize:18}}>Your Stats</div>{[{label:"Current Streak",val:`${state.streak} days`,icon:"🔥",color:"#ff9500"},{label:"Total XP",val:`${state.xp} XP`,icon:"⚡",color:"#ffd700"},{label:"Total Clean Days",val:state.totalCleanDays,icon:"✅",color:"#58cc02"},{label:"Total Slips",val:state.slips,icon:"💀",color:"#ff4b4b"},{label:"Current League",val:`${league.icon} ${league.name}`,icon:"🏆",color:"#89e219"},{label:"Badges Earned",val:`${state.earnedBadges.length} / ${BADGES.length}`,icon:"🏅",color:"#a78bfa"}].map(({label,val,icon,color})=><div key={label} style={{background:"#1e293b",borderRadius:14,padding:"16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>{icon}</span><span style={{color:"#94a3b8",fontSize:14}}>{label}</span></div><span style={{fontWeight:900,fontSize:16,color}}>{val}</span></div>)}<div style={{fontWeight:800,fontSize:16,marginTop:4}}>Last 30 Days</div><div style={{background:"#1e293b",borderRadius:14,padding:14,display:"flex",flexWrap:"wrap",gap:6}}>{Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(29-i));const key=d.toISOString().split("T")[0];const entry=state.history.find((h:{date:string,clean:boolean})=>h.date===key);return <div key={key} title={key} style={{width:22,height:22,borderRadius:6,background:entry?(entry.clean?"#58cc02":"#ff4b4b"):"#334155"}}/>;})}</div><button onClick={resetAll} style={{background:"transparent",color:"#475569",border:"1px solid #334155",borderRadius:10,padding:"10px",fontSize:13,cursor:"pointer",marginTop:8}}>🔄 Reset All Data</button></div>}
      <style>{`@keyframes fadeUp{0%{opacity:1;transform:translateX(-50%) translateY(0)}80%{opacity:1}100%{opacity:0;transform:translateX(-50%) translateY(-40px)}}`}</style>
    </div>
  );
}
