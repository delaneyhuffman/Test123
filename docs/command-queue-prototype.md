# Command Queue Status and Conflict Prevention Prototype

## Source

This prototype is based on the approved PRD **Command Queue Status and Conflict Prevention** from the Acme Robotics Notion workflow.

The upstream evidence described recurring command latency and ambiguity during shift-change windows. Operators could not tell whether route override commands were queued, processing, confirmed, or failed, which led to duplicate submissions and, in some cases, conflicting reroutes for the same robot.

## Objective

Create a small, reviewable prototype that shows how Robotics Control could make command queue state visible and reduce operator confusion during high-concurrency handoffs.

## Prototype scope

This prototype demonstrates:

1. **Command lifecycle states**
   - `Queued`
   - `Processing`
   - `Confirmed`
   - `Failed`
   - `Duplicate/Rejected`
   - `Conflict Detected`

2. **Duplicate suppression**
   - Rejects repeat route override submissions from the same operator for the same robot within a configurable window.
   - Returns an operator-friendly rejection reason instead of silently adding to the backlog.

3. **Conflict detection**
   - Detects when a new route override conflicts with a queued or processing command for the same robot.
   - Gives supervisors a clear priority path while preventing ambiguous operator behavior.

4. **Supervisor priority**
   - Supervisor commands can supersede non-supervisor commands when a conflict exists.
   - Priority decisions are recorded in the audit log.

5. **Auditability**
   - Every command submission, duplicate rejection, conflict, state transition, and priority override is logged.

## Out of scope

- Production robot routing or path-planning behavior
- Real-time networking and connectivity handling
- Final safety policy or customer-facing commitments
- Authentication, authorization, or full permission-tier configuration
- UI polish beyond illustrating the expected command states

## Review checklist

- [ ] PM confirms the workflow matches the approved PRD intent.
- [ ] Engineering confirms the command state model is feasible.
- [ ] Safety / operations reviewers confirm conflict and supervisor-priority behavior is safe to explore further.
- [ ] CSM confirms the demo is understandable for FleetOps and WareEx follow-up.

## Suggested next iteration

If this prototype is accepted, the next iteration should connect the state machine to a minimal UI mock that shows command status cards during a simulated shift-change burst.
