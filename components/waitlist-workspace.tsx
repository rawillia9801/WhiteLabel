"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, History, ListOrdered, PawPrint, Plus, UsersRound } from "lucide-react";
import { useBreedingData } from "./use-breeding-data";

const value = (row: Record<string, unknown> | undefined, key: string) => String(row?.[key] ?? "");
const familyName = (row: Record<string, unknown> | undefined) => value(row, "name") || `Family #${row?.id ?? ""}`;
const formRecord = (event: FormEvent<HTMLFormElement>) => Object.fromEntries(new FormData(event.currentTarget).entries());

export function WaitlistWorkspace() {
  const { data, loading, saving, error, act } = useBreedingData();
  const [selectedId, setSelectedId] = useState(0);
  const activeEntries = useMemo(() => data.kennel_waitlist_entries
    .filter((entry) => !["Completed", "Removed"].includes(value(entry, "status")))
    .sort((left, right) => Number(left.picking_position || Number.MAX_SAFE_INTEGER) - Number(right.picking_position || Number.MAX_SAFE_INTEGER) || Number(left.priority_rank) - Number(right.priority_rank)), [data.kennel_waitlist_entries]);
  const selected = data.kennel_waitlist_entries.find((entry) => Number(entry.id) === selectedId) || activeEntries[0];
  const availablePuppies = data.puppies.filter((puppy) => !puppy.buyer_id || Number(puppy.buyer_id) === Number(selected?.buyer_id));
  const selectedHistory = data.kennel_waitlist_history.filter((item) => Number(item.waitlist_entry_id) === Number(selected?.id)).sort((left, right) => value(right, "created_at").localeCompare(value(left, "created_at")));

  async function submit(action: string, event: FormEvent<HTMLFormElement>, extra: Record<string, unknown> = {}) {
    event.preventDefault();
    const form = event.currentTarget;
    await act(action, { ...formRecord(event), ...extra });
    form.reset();
  }

  async function move(entryId: number, direction: -1 | 1) {
    const index = activeEntries.findIndex((entry) => Number(entry.id) === entryId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= activeEntries.length) return;
    const orderedIds = activeEntries.map((entry) => Number(entry.id));
    [orderedIds[index], orderedIds[target]] = [orderedIds[target], orderedIds[index]];
    await act("reorder_waitlist", { ordered_ids: orderedIds, note: "Queue order changed from the waitlist workspace." });
  }

  if (loading) return <div className="breeding-workspace-state">Loading waitlist…</div>;

  return <div className="waitlist-workspace">
    {error && <div className="inline-error">{error}</div>}
    <section className="waitlist-overview panel-wide"><div><small>APPLICATION TO PUPPY PICK</small><h2>A fair, auditable picking queue</h2><p>Preferences, deposit state, position changes, passes, litter moves, and final puppy assignment stay on one family record.</p></div><div><span><b>{activeEntries.length}</b><small>Active families</small></span><span><b>{activeEntries.filter((entry) => value(entry, "status") === "Ready to Pick").length}</b><small>Ready to pick</small></span><span><b>{data.kennel_waitlist_entries.filter((entry) => value(entry, "status") === "Puppy Assigned").length}</b><small>Assigned</small></span></div></section>

    <div className="waitlist-layout">
      <section className="breeding-panel waitlist-add"><header><div><small>NEW QUEUE ENTRY</small><h2>Add approved family</h2></div><UsersRound size={22}/></header><form className="breeding-form" onSubmit={(event) => submit("waitlist_entry", event)}>
        <label className="wide"><span>Family</span><select name="buyer_id" required><option value="">Choose approved family</option>{data.buyers.map((buyer) => <option key={String(buyer.id)} value={String(buyer.id)}>{familyName(buyer)} · {value(buyer, "application_status")}</option>)}</select></label>
        <label><span>Preferred litter</span><select name="litter_id"><option value="">Any / future litter</option>{data.litters.map((litter) => <option key={String(litter.id)} value={String(litter.id)}>{value(litter, "name")}</option>)}</select></label><label><span>Joined</span><input name="joined_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required/></label>
        <label><span>Preferred sex</span><select name="preferred_sex"><option value="">No preference</option><option>Female</option><option>Male</option></select></label><label><span>Preferred color</span><input name="preferred_color"/></label><label><span>Preferred coat</span><input name="preferred_coat"/></label><label><span>Deposit status</span><select name="deposit_status"><option>Not recorded</option><option>Pending</option><option>Received</option><option>Waived</option><option>Refunded</option></select></label>
        <label className="wide"><span>Other preferences / notes</span><textarea name="other_preferences" rows={3}/></label><button className="primary-action wide" disabled={saving}><Plus size={16}/> Add to waitlist</button>
      </form></section>

      <section className="breeding-panel waitlist-queue"><header><div><small>PICKING ORDER</small><h2>Active queue</h2></div><ListOrdered size={22}/></header>{activeEntries.length ? <div className="queue-list">{activeEntries.map((entry, index) => { const buyer = data.buyers.find((candidate) => Number(candidate.id) === Number(entry.buyer_id)); const litter = data.litters.find((candidate) => Number(candidate.id) === Number(entry.litter_id)); return <article className={Number(selected?.id) === Number(entry.id) ? "selected" : ""} key={String(entry.id)}><button className="queue-main" onClick={() => setSelectedId(Number(entry.id))}><span className="queue-position">{String(entry.picking_position || index + 1)}</span><span><em>{value(entry, "status")}</em><b>{familyName(buyer)}</b><small>{value(litter, "name") || "Any / future litter"} · {value(entry, "deposit_status")}</small></span><span><small>Preferences</small><b>{[value(entry, "preferred_sex"), value(entry, "preferred_color"), value(entry, "preferred_coat")].filter(Boolean).join(" · ") || "Open"}</b></span></button><div className="queue-order-actions"><button aria-label={`Move ${familyName(buyer)} up`} disabled={saving || index === 0} onClick={() => void move(Number(entry.id), -1)}><ArrowUp size={15}/></button><button aria-label={`Move ${familyName(buyer)} down`} disabled={saving || index === activeEntries.length - 1} onClick={() => void move(Number(entry.id), 1)}><ArrowDown size={15}/></button></div></article>; })}</div> : <div className="breeding-empty"><UsersRound size={27}/><b>No active waitlist entries</b><p>Add an approved family to begin a picking queue.</p></div>}</section>
    </div>

    {selected && <section className="breeding-panel waitlist-actions"><header><div><small>SELECTED FAMILY</small><h2>{familyName(data.buyers.find((buyer) => Number(buyer.id) === Number(selected.buyer_id)))}</h2></div><span>{value(selected, "status")}</span></header><div className="waitlist-action-grid">
      <form onSubmit={(event) => submit("assign_waitlist_puppy", event, { waitlist_entry_id: selected.id })}><h3><PawPrint size={17}/> Assign puppy</h3><label><span>Available puppy</span><select name="puppy_id" required><option value="">Choose puppy</option>{availablePuppies.map((puppy) => <option key={String(puppy.id)} value={String(puppy.id)}>{value(puppy, "name")} · {value(puppy, "sex")} · {value(puppy, "color")}</option>)}</select></label><label><span>Audit note</span><input name="note" placeholder="Optional assignment note"/></label><button disabled={saving || !availablePuppies.length}><CheckCircle2 size={15}/> Confirm assignment</button></form>
      <form onSubmit={(event) => submit("move_waitlist_entry", event, { waitlist_entry_id: selected.id })}><h3><ListOrdered size={17}/> Queue action</h3><label><span>Action / status</span><select name="status" required><option>Ready to Pick</option><option>Passed</option><option>Next Litter</option><option>On Hold</option><option>Waiting</option><option>Completed</option><option>Removed</option></select></label><label><span>New position</span><input name="picking_position" type="number" min="1" defaultValue={String(selected.picking_position || "")}/></label><label className="wide"><span>Required audit note</span><input name="note" required placeholder="Why is this entry changing?"/></label><button disabled={saving}>Apply action</button></form>
      <div className="waitlist-history"><h3><History size={17}/> Audit history</h3>{selectedHistory.length ? selectedHistory.map((item) => <article key={String(item.id)}><span><b>{value(item, "action")}</b><small>{new Date(value(item, "created_at")).toLocaleString()}</small></span><p>{value(item, "note") || `${value(item, "previous_status") || "New"} → ${value(item, "new_status")}`}</p></article>) : <p>No changes recorded yet.</p>}</div>
    </div></section>}
  </div>;
}
