const { useMemo, useState, useRef, useLayoutEffect, useEffect } = React;

/** TYPES & PARSER */
function opt(text, correct = false){ return { text, correct }; }

function parseQuizModel(input){
  let obj = input;
  if(typeof input === 'string'){
    try { obj = JSON.parse(input); }
    catch(e){ throw new Error('Invalid JSON in quizModelJSON: ' + e.message); }
  }
  const meta = obj.meta || {};
  const rows = Array.isArray(obj.rows) ? obj.rows.map(r => r.slice()) : [];
  const edges = Array.isArray(obj.edges) ? obj.edges.map(e => ({from: e.from, to: e.to})) : [];
  const issues = [];

  const cardsById = new Map();
  const cards = (obj.cards || []).map((c, idx) => {
    if(!c || !c.id){ issues.push(`Card at index ${idx} missing id`); return null; }
    if(cardsById.has(c.id)) issues.push(`Duplicate card id: ${c.id}`);
    const options = (c.options || []).map(o => ({ text: o.text, correct: !!o.correct }));
    const correctCount = options.filter(o => o.correct).length;
    if(correctCount === 0) issues.push(`Card ${c.id} has no correct options`);
    const required = typeof c.required === 'number' ? c.required : correctCount;
    const card = { id: c.id, question: c.question || '', required, options };
    cardsById.set(card.id, card);
    return card;
  }).filter(Boolean);

  const idSet = new Set(cards.map(c => c.id));
  rows.flat().forEach(id => { if(!idSet.has(id) && id !== 'jx_tox') issues.push(`rows references unknown id: ${id}`); });
  edges.forEach(e => {
    if(e.from !== 'jx_tox' && !idSet.has(e.from)) issues.push(`edge.from unknown: ${e.from}`);
    if(e.to   !== 'jx_tox' && !idSet.has(e.to))   issues.push(`edge.to unknown: ${e.to}`);
  });

  return { meta, rows, edges, cards, issues };
}

/** CONTENT (JSON) */
const quizModelJSON = JSON.stringify({
  meta: { title: "Lithium — Multi-Select Quiz Flow (React-only)" },
  rows: [
    ["start"],
    ["baseline"],
    ["target_maint", "target_mania"],
    ["level_schedule"],
    ["renal_thyroid_schedule"],
    ["increase", "decrease"],
    ["jx_tox"],
    ["tox_mild", "tox_moderate", "tox_severe"],
    ["long_term"],
    ["pharmacology"],
  ],
  edges: [
    { from: "start", to: "baseline" },
    { from: "baseline", to: "target_maint" },
    { from: "baseline", to: "target_mania" },
    { from: "target_maint", to: "level_schedule" },
    { from: "target_mania", to: "level_schedule" },
    { from: "level_schedule", to: "renal_thyroid_schedule" },
    { from: "renal_thyroid_schedule", to: "increase" },
    { from: "renal_thyroid_schedule", to: "decrease" },
    { from: "increase", to: "jx_tox" },
    { from: "decrease", to: "jx_tox" },
    { from: "jx_tox", to: "tox_mild" },
    { from: "jx_tox", to: "tox_moderate" },
    { from: "jx_tox", to: "tox_severe" },
    { from: "tox_mild", to: "long_term" },
    { from: "tox_moderate", to: "long_term" },
    { from: "tox_severe", to: "long_term" },
    { from: "long_term", to: "pharmacology" },
  ],
  cards: [
    { id: "start", question: "Considering lithium — which are indications?", options: [
      opt("Bipolar disorder (acute mania, maintenance)", true),
      opt("Schizoaffective disorder (bipolar type)", true),
      opt("Refractory depression (augmentation)", true),
      opt("Generalized anxiety disorder"), opt("Obsessive–compulsive disorder"), opt("Panic disorder")
    ] },
    { id: "baseline", question: "Before/at start — what baseline checks are needed?", options: [
      opt("Kidney (renal) function", true), opt("Thyroid function", true),
      opt("ECG if risk factors", true), opt("Pregnancy test if relevant", true),
      opt("Mandatory liver biopsy"), opt("EEG for all patients"), opt("HLA-B*1502 genotyping"), opt("DEXA scan")
    ] },
    { id: "target_maint", question: "Maintenance — target serum trough?", options: [
      opt("0.6–1.0 mEq/L", true), opt("0.2–0.5 mEq/L"), opt("1.5–2.0 mEq/L"), opt("No target range needed")
    ] },
    { id: "target_mania", question: "Acute mania — target serum trough?", options: [
      opt("Up to 1.2 mEq/L", true), opt("Up to 0.4 mEq/L"), opt("At least 2.0 mEq/L"), opt("Exactly 0.6 mEq/L")
    ] },
    { id: "level_schedule", question: "Lithium levels — how to monitor over time?", options: [
      opt("12-hour trough", true), opt("Check 5–7 days after start or dose change", true), opt("Then every 3–6 months", true),
      opt("Peak at 1 hour daily"), opt("Only yearly levels"), opt("Random spot levels anytime")
    ] },
    { id: "renal_thyroid_schedule", question: "Renal & thyroid — monitoring frequency?", options: [
      opt("Every 6–12 months", true), opt("Weekly"), opt("Monthly"), opt("Every 2 years")
    ] },
    { id: "increase", question: "Which increase lithium levels?", options: [
      opt("Dehydration", true), opt("Low sodium intake", true), opt("Diarrhea & vomiting", true), opt("Thiazide diuretics", true),
      opt("ACE inhibitors", true), opt("ARBs", true), opt("Most NSAIDs (ibuprofen, naproxen)", true),
      opt("Tetracyclines", true), opt("Metronidazole", true), opt("Spironolactone (variable effect)", true),
      opt("High sodium intake"), opt("Caffeine"), opt("Theophylline"), opt("Pregnancy (↑ GFR)"), opt("Osmotic diuresis"), opt("Acetazolamide")
    ] },
    { id: "decrease", question: "Which decrease lithium levels?", options: [
      opt("High sodium intake", true), opt("Caffeine", true), opt("Theophylline", true),
      opt("Pregnancy (↑ GFR)", true), opt("Osmotic diuresis", true), opt("Acetazolamide", true),
      opt("Thiazide diuretics"), opt("ACE inhibitors"), opt("Most NSAIDs (ibuprofen, naproxen)"), opt("Metronidazole")
    ] },
    { id: "tox_mild", question: "Mild toxicity — select features", options: [
      opt("Nausea", true), opt("Vomiting", true), opt("Diarrhea", true), opt("Fine tremor", true),
      opt("Coarse tremor"), opt("Seizures"), opt("Coma"), opt("Arrhythmias")
    ] },
    { id: "tox_moderate", question: "Moderate toxicity — select features", options: [
      opt("Coarse tremor", true), opt("Fasciculations", true), opt("Myoclonus", true),
      opt("Ataxia", true), opt("Dysarthria", true), opt("Confusion", true),
      opt("Fine tremor"), opt("Acute kidney injury"), opt("Coma")
    ] },
    { id: "tox_severe", question: "Severe toxicity — select features", options: [
      opt("Seizures", true), opt("Coma", true), opt("Arrhythmias", true), opt("Acute kidney injury", true),
      opt("Ataxia"), opt("Fine tremor"), opt("Diarrhea")
    ] },
    { id: "long_term", question: "Long-term adverse effects — select all listed", options: [
      opt("Renal: nephrogenic DI, chronic kidney disease", true),
      opt("Endocrine: hypothyroidism; hyperparathyroidism + hypercalcemia", true),
      opt("Neurologic: persistent tremor (treat with propranolol)", true),
      opt("Other: weight gain, edema, acne", true),
      opt("Pregnancy: first-trimester Ebstein anomaly risk", true),
      opt("Cirrhosis"), opt("Cataracts"), opt("Pancytopenia")
    ] },
    { id: "pharmacology", question: "Key pharmacology — select all correct", options: [
      opt("Excretion: renal only", true),
      opt("Reabsorbed with sodium in proximal tubule", true),
      opt("Very narrow therapeutic range", true),
      opt("Primarily hepatic metabolism"), opt("Biliary excretion"), opt("Wide therapeutic range")
    ] },
  ]
}, null, 2);

/** Parse & expose normalized model */
const parsedModel = parseQuizModel(quizModelJSON);
const quizSpec = parsedModel.cards;
const LAYOUT_ROWS = parsedModel.rows;
const EDGES = parsedModel.edges;
const TITLE = parsedModel.meta?.title || "Quiz";
const MODEL_ISSUES = parsedModel.issues;

/** LOOK & FEEL HELPERS */
function nodeDims(id){
  if(id==="jx_tox") return {w:16,h:16, cls:"junction"};
  if(["increase","decrease"].includes(id)) return {w:720,h:280, cls:"xxl"};
  if(["start","baseline"].includes(id)) return {w:640,h:240, cls:"wide"};
  if(["long_term"].includes(id)) return {w:680,h:260, cls:"xwide"};
  if(["level_schedule"].includes(id)) return {w:560,h:200, cls:"small"};
  return {w:520,h:200, cls:""};
}

/** UI COMPONENTS */
function OptionBox({ selected, showResult, correct, text, onToggle }){
  const classes = ["option"];
  if(selected && !showResult) classes.push("selected");
  if(showResult){
    classes.push("show");
    if(selected && correct) classes.push("correct","selected");
    else if(selected && !correct) classes.push("incorrect","selected");
    else if(!selected && correct) classes.push("correct","missed");
  }
  return (
    <div className={classes.join(" ")} onClick={onToggle}
      title={showResult ? (correct ? "Correct" : (selected ? "Incorrect" : "Should be selected")) : "Toggle selection"}>
      {text}
    </div>
  );
}

function QuizCard({ nodeId, question, options, selections, setSelections, checked, setChecked, refCb }){
  const selected = selections[nodeId] || new Set();
  const correctSet = new Set(options.filter(o=>o.correct).map(o=>o.text));

  const toggle = (id) => {
    if(checked[nodeId]) return;
    const next = new Set(selected);
    if(next.has(id)) next.delete(id); else next.add(id);
    setSelections(prev => ({ ...prev, [nodeId]: next }));
  };

  const onCheck = () => setChecked(prev => ({ ...prev, [nodeId]: true }));
  const onClear = () => { setSelections(prev => ({ ...prev, [nodeId]: new Set() })); setChecked(prev => ({ ...prev, [nodeId]: false })); };

  const fullCorrect = checked[nodeId] && selected.size === correctSet.size && [...selected].every(x => correctSet.has(x));
  const dims = nodeDims(nodeId);

  return (
    <div className={`card ${dims.cls}`} ref={refCb} style={{ width: dims.w, minHeight: dims.h }}>
      {nodeId!=="jx_tox" && (
        <>
          <div className="label">Question</div>
          <div className="question">{question}</div>

          <div className="options">
            {options.map((o, i) => (
              <OptionBox
                key={o.text}
                text={`${String.fromCharCode(65+i)}. ${o.text}`}
                selected={selected.has(o.text)}
                showResult={!!checked[nodeId]}
                correct={o.correct}
                onToggle={() => toggle(o.text)}
              />
            ))}
          </div>

          <div className="actions">
            <button className="btn" onClick={onCheck}>Check</button>
            <button className="btn" onClick={onClear}>Clear</button>
            {checked[nodeId] && (
              <span style={{marginLeft:8, fontSize:14, color: fullCorrect ? "var(--good)" : "var(--bad)"}}>
                {fullCorrect ? "All correct" : "Review the highlighted options"}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** CUSTOM HOOKS */
function useQuizScore(quizSpec, selections, checked){
  return React.useMemo(()=>{
    let ok = 0;
    for(const card of quizSpec){
      if(!checked[card.id]) continue;
      const sel = selections[card.id];
      if(!sel || !(sel instanceof Set)) continue;
      const correctIds = new Set(card.options.filter(o=>o.correct).map(o=>o.text));
      const exact = sel.size === correctIds.size && [...sel].every(x=>correctIds.has(x));
      if(exact) ok++;
    }
    return { ok, total: quizSpec.length };
  }, [quizSpec, selections, checked]);
}

function useConnectors(edges){
  const containerRef = useRef(null);
  const nodeRefs = useRef({});
  const setNodeRef = (id) => (el) => { if(el) nodeRefs.current[id] = el; };
  const [paths, setPaths] = useState([]);

  const measure = () => {
    const cont = containerRef.current; if(!cont) return;
    const cRect = cont.getBoundingClientRect();
    const centers = {};
    Object.entries(nodeRefs.current).forEach(([id, el])=>{
      if(!el) return; const r = el.getBoundingClientRect();
      centers[id] = {
        top: { x: r.left + r.width/2 - cRect.left, y: r.top - cRect.top },
        bottom: { x: r.left + r.width/2 - cRect.left, y: r.bottom - cRect.top },
        center: { x: r.left + r.width/2 - cRect.left, y: r.top + r.height/2 - cRect.top }
      };
    });
    const anchor = (id, which) => id==="jx_tox" ? centers[id]?.center : centers[id]?.[which];
    const pts = edges.map(({from,to})=>{
      const p1 = anchor(from, "bottom");
      const p2 = anchor(to, "top");
      if(!p1 || !p2) return null;
      const dx = Math.abs(p2.x - p1.x);
      const d = Math.max(20, Math.min(120, dx));
      return `M ${p1.x} ${p1.y} C ${p1.x} ${p1.y + d}, ${p2.x} ${p2.y - d}, ${p2.x} ${p2.y}`;
    }).filter(Boolean);
    setPaths(pts);
  };

  useLayoutEffect(()=>{ measure(); }, []);
  useEffect(()=>{
    const ro = new ResizeObserver(()=>measure());
    if(containerRef.current) ro.observe(containerRef.current);
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return ()=>{ ro.disconnect(); window.removeEventListener('resize', onResize); };
  }, []);

  return { containerRef, setNodeRef, paths, measure };
}

/** APP */
function App(){
  const [selections, setSelections] = useState({});
  const [checked, setChecked] = useState({});
  const score = useQuizScore(quizSpec, selections, checked);
  const { containerRef, setNodeRef, paths, measure } = useConnectors(EDGES);

  const resetAll = () => { setSelections({}); setChecked({}); measure(); };

  return (
    <div style={{height:"100%"}}>
      <div className="header">
        <div className="title">{TITLE}</div>
        <div style={{display:"flex", gap:"8px", alignItems:"center"}}>
          <span className="score">Score (exact cards): {score.ok} / {score.total}</span>
          <button className="btn" onClick={resetAll}>Reset All</button>
        </div>
      </div>

      {MODEL_ISSUES.length > 0 && (
        <div className="panel bad">
          <h3>Model Issues</h3>
          <ul style={{margin:0, paddingLeft:18}}>
            {MODEL_ISSUES.map((m,i)=>(<li key={i}>{m}</li>))}
          </ul>
        </div>
      )}

      <div ref={containerRef} className="canvas">
        <svg className="connectors">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"></path>
            </marker>
          </defs>
          {paths.map((d, idx)=> <path key={idx} d={d} className="arrow" markerEnd="url(#arrow)" />)}
        </svg>

        {LAYOUT_ROWS.map((row, rIdx)=>(
          <div className="row" key={rIdx}>
            {row.map((id)=>{
              const spec = id === "jx_tox" ? { id, question:"", options:[] } : quizSpec.find(q=>q.id===id);
              const dims = nodeDims(id);
              return (
                <QuizCard
                  key={id}
                  nodeId={id}
                  question={spec.question}
                  options={spec.options}
                  selections={selections}
                  setSelections={setSelections}
                  checked={checked}
                  setChecked={setChecked}
                  refCb={setNodeRef(id)}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
