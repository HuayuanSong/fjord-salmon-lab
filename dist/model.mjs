/** Educational model v0.1. All numerical coefficients are illustrative.
 * Daily exponential competing-risk updates preserve nonnegative populations.
 * Fish weight is grams, N is fish, lice compartments are absolute counts.
 * F tracks adult females; males are omitted, with fertilisation assumed.
 */
export const DAYS = 365;
export const DEFAULTS = Object.freeze({ fish:100000, weight:150, warming:0, feed:1, pressure:0.7, seedDay:35, treatmentDay:110, treatment:true, repeat:false, efficacy:85, method:'broad', growth:'thermal', infestation:true });
export const PRESETS = {
  calm: {name:'A calm start', subtitle:'Meet a growing school.', values:{...DEFAULTS, infestation:false, treatment:false}},
  lice: {name:'An unwelcome guest', subtitle:'Follow a parasite through its life cycle.', values:{...DEFAULTS, treatment:false}},
  response: {name:'A timely response', subtitle:'Explore a treatment and its trade-offs.', values:{...DEFAULTS}},
  warm: {name:'A warmer season', subtitle:'One change. Two biological responses.', values:{...DEFAULTS, warming:3}}
};
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export function normalize(input={}) {
  const p={...DEFAULTS,...input};
  for(const [k,a,b] of [['fish',1000,200000],['weight',50,500],['warming',-3,4],['feed',0.65,1.2],['pressure',0,2],['seedDay',1,300],['treatmentDay',1,350],['efficacy',0,100]]) {
    const v=Number(p[k]); p[k]=clamp(Number.isFinite(v)?v:DEFAULTS[k],a,b);
  }
  for(const k of ['infestation','treatment','repeat']) p[k]=p[k]===true;
  p.growth=['thermal','gompertz','bertalanffy'].includes(p.growth)?p.growth:'thermal';
  p.method=p.method==='adult'?'adult':'broad';
  p.seedDay=Math.round(p.seedDay); p.treatmentDay=Math.round(p.treatmentDay);
  return p;
}
export function temperature(day,p) { return 10.5+3.5*Math.sin(2*Math.PI*(day-55)/365)+p.warming; }
function flow(n,development,mortality) {
  const rate=development+mortality;
  const lost=n*(-Math.expm1(-rate));
  return {stay:n-lost, move:rate>0?lost*development/rate:0};
}
export function simulate(input={}, variation={}) {
  const p=normalize(input), v={growth:1, reproduction:1, mortality:1, efficacy:1,...variation};
  let N=p.fish,W=p.weight,R=0,J=0,M=0,F=0, recovery=0, treatments=0;
  const records=[];
  for(let day=0;day<=DAYS;day++) {
    const T=temperature(day,p), events=[];
    if(day===p.seedDay && p.infestation) {R+=N*0.6;events.push('lice');}
    const treat=p.treatment && day>=p.treatmentDay && (day===p.treatmentDay || (p.repeat && (day-p.treatmentDay)%70===0));
    if(treat) {
      const e=clamp(p.efficacy/100*v.efficacy,0,1), before=N;
      N*=1-0.003*v.mortality;
      const f=before>0?N/before:0;
      J*=f*(1-e*(p.method==='adult'?0.2:0.9));
      M*=f*(1-e*(p.method==='adult'?0.65:1)); F*=f*(1-e);
      recovery=7;treatments++;events.push('treatment');
    }
    const mobile=N>0?(M+F)/N:0;
    records.push({day,N,W,B:N*W/1e6,R,J,M,F,lice:N>0?F/N:0,mobile,T,treatments,recovery,events});
    if(day===DAYS) break;
    const tf=clamp(Math.pow(1.8,(T-10)/10),0.3,2.5);
    const attach=0.075*clamp(N/p.fish,0,1.4);
    const larval=flow(R,attach,0.18), juvenile=flow(J,0.038*tf,0.012), motile=flow(M,0.035*tf,0.017);
    const crowding=1+mobile/12;
    const incoming=p.infestation && day>=p.seedDay ? p.fish*p.pressure*0.0015 : 0;
    const births=F*0.8*tf*v.reproduction/crowding;
    R=larval.stay+births+incoming;
    J=juvenile.stay+larval.move;
    M=motile.stay+juvenile.move;
    F=F*Math.exp(-0.025)+motile.move*0.5;
    // The other half of maturing mobile lice are males and leave this reduced model.
    const hazard=(0.00014+0.00023*Math.max(0,mobile-1))*v.mortality;
    const surviving=Math.exp(-hazard);N*=surviving;
    J*=surviving;M*=surviving;F*=surviving;
    const condition=p.feed/(1+0.055*mobile)*(recovery>0?0.75:1)*v.growth;
    if(p.growth==='thermal') {
      const hot= Math.exp(-0.065*Math.max(0,T-15)**2);
      W=(Math.cbrt(W)+0.00215*Math.max(0,T)*hot*condition)**3;
    } else if(p.growth==='gompertz') {
      W=6500*Math.exp(Math.log(W/6500)*Math.exp(-0.0042*condition));
    } else {
      const root=Math.cbrt(6500)+(Math.cbrt(W)-Math.cbrt(6500))*Math.exp(-0.0028*condition);
      W=root**3;
    }
    recovery=Math.max(0,recovery-1);
  }
  return records;
}
export function calculate(input={}) {
  const p=normalize(input),main=simulate(p),untreated=simulate({...p,treatment:false});
  const clean=simulate({...p,infestation:false,treatment:false});
  // Four deliberately chosen parameter perturbations, NOT a confidence interval.
  const variations=[{growth:0.9,reproduction:1.18,mortality:1.2,efficacy:0.9},{growth:1.1,reproduction:0.82,mortality:0.8,efficacy:1.1},{growth:0.95,reproduction:0.9,mortality:1.1,efficacy:1},{growth:1.05,reproduction:1.1,mortality:0.9,efficacy:1}];
  const alternatives=variations.map(v=>simulate(p,v));
  const band=main.map((r,i)=>({day:i,Bmin:Math.min(r.B,...alternatives.map(a=>a[i].B)),Bmax:Math.max(r.B,...alternatives.map(a=>a[i].B)),Lmin:Math.min(r.lice,...alternatives.map(a=>a[i].lice)),Lmax:Math.max(r.lice,...alternatives.map(a=>a[i].lice))}));
  return {p,main,untreated,clean,band};
}
