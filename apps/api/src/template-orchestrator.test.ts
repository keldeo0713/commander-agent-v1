import { describe, expect, it } from "vitest";
import { TemplateOrchestrator, type FunctionalSlot, type MechanicCandidate, type TemplateOrchestrationPorts } from "./template-orchestrator.js";

const commander={oracleId:"commander-1",name:"Any Commander",colorIdentity:["G"]};
const mechanic:MechanicCandidate={id:"tokens",name:"Tokens",componentIds:["token-production","board-scaling"],reason:"Commander creates tokens",provenanceId:"taxonomy/1"};
const slots:FunctionalSlot[]=[{quantity:1,roleId:"commander",objective:"Lead",selectionRule:"Resolved commander"},{quantity:37,roleId:"lands",objective:"Make land drops",selectionRule:"Match identity"},{quantity:62,roleId:"engine",objective:"Execute and win",selectionRule:"Selected mechanics"}];
function ports(overrides:Partial<TemplateOrchestrationPorts>={}):TemplateOrchestrationPorts{return{resolveCommander:()=>Promise.resolve(commander),retrieveMechanics:()=>Promise.resolve([mechanic,mechanic]),mapCustomMechanic:()=>Promise.resolve(mechanic),optimize:()=>Promise.resolve(slots),buildExample:()=>Promise.resolve([{oracleId:"commander-1",name:"Any Commander",quantity:1,roleId:"commander",commander:true},{oracleId:"land",name:"Forest",quantity:37,roleId:"lands",commander:false},{oracleId:"engine",name:"Engine Card",quantity:62,roleId:"engine",commander:false}]),...overrides}}

describe("live template orchestration",()=>{
  it("resolves any commander and returns deduplicated explainable mechanics",async()=>{const result=await new TemplateOrchestrator(ports()).start("Any Commander",3);expect(result.status).toBe("ready");if(result.status==="ready")expect(result.mechanics).toEqual([mechanic])});
  it("rejects custom ideas that do not map to components",async()=>{const orchestrator=new TemplateOrchestrator(ports({mapCustomMechanic:()=>Promise.resolve(null)}));expect(await orchestrator.mapCustom("wear hats",commander)).toBeNull()});
  it("enforces exact template and example role mathematics",async()=>{const orchestrator=new TemplateOrchestrator(ports());const template=await orchestrator.optimize(commander,3,[mechanic]);expect(template.slots.reduce((sum,slot)=>sum+slot.quantity,0)).toBe(100);expect((await orchestrator.example(template)).reduce((sum,entry)=>sum+entry.quantity,0)).toBe(100)});
  it("rejects an example that disagrees with its template",async()=>{const orchestrator=new TemplateOrchestrator(ports({buildExample:()=>Promise.resolve([{oracleId:"commander-1",name:"Any Commander",quantity:1,roleId:"commander",commander:true},{oracleId:"wrong",name:"Wrong",quantity:99,roleId:"wrong",commander:false}])}));const template=await orchestrator.optimize(commander,3,[mechanic]);await expect(orchestrator.example(template)).rejects.toThrow("role mismatch")});
});
