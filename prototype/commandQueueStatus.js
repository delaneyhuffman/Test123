/**
 * Command Queue Status and Conflict Prevention Prototype
 *
 * Demo-only logic for the Acme Robotics PRD:
 * "Command Queue Status and Conflict Prevention".
 *
 * This module is intentionally small and dependency-free so reviewers can inspect
 * the workflow before any production implementation work begins.
 */

const COMMAND_STATUS = Object.freeze({
  QUEUED: 'Queued',
  PROCESSING: 'Processing',
  CONFIRMED: 'Confirmed',
  FAILED: 'Failed',
  DUPLICATE_REJECTED: 'Duplicate/Rejected',
  CONFLICT_DETECTED: 'Conflict Detected',
  SUPERSEDED: 'Superseded',
});

const ROLE_PRIORITY = Object.freeze({
  operator: 1,
  supervisor: 2,
  safety_officer: 3,
});

class CommandQueuePrototype {
  constructor({ duplicateWindowMs = 10_000 } = {}) {
    this.duplicateWindowMs = duplicateWindowMs;
    this.commands = [];
    this.auditLog = [];
  }

  submitRouteOverride({
    operatorId,
    operatorRole = 'operator',
    robotId,
    targetRoute,
    submittedAt = Date.now(),
  }) {
    this.#requireValue('operatorId', operatorId);
    this.#requireValue('robotId', robotId);
    this.#requireValue('targetRoute', targetRoute);

    const duplicate = this.#findRecentDuplicate({ operatorId, robotId, targetRoute, submittedAt });
    if (duplicate) {
      return this.#recordRejectedCommand({
        operatorId,
        operatorRole,
        robotId,
        targetRoute,
        submittedAt,
        status: COMMAND_STATUS.DUPLICATE_REJECTED,
        reason: `Duplicate command rejected: ${operatorId} already submitted ${targetRoute} for ${robotId} within ${this.duplicateWindowMs}ms.`,
        relatedCommandId: duplicate.id,
      });
    }

    const conflict = this.#findActiveConflict({ robotId, targetRoute });
    if (conflict) {
      const canSupersede = this.#priority(operatorRole) > this.#priority(conflict.operatorRole);

      if (!canSupersede) {
        return this.#recordRejectedCommand({
          operatorId,
          operatorRole,
          robotId,
          targetRoute,
          submittedAt,
          status: COMMAND_STATUS.CONFLICT_DETECTED,
          reason: `Conflict detected: ${robotId} already has an active command for route ${conflict.targetRoute}. Supervisor review required.`,
          relatedCommandId: conflict.id,
        });
      }

      this.#transition(conflict, COMMAND_STATUS.SUPERSEDED, {
        reason: `Superseded by ${operatorRole} ${operatorId}`,
      });
    }

    const command = {
      id: this.#nextCommandId(),
      operatorId,
      operatorRole,
      robotId,
      targetRoute,
      submittedAt,
      status: COMMAND_STATUS.QUEUED,
      history: [{ status: COMMAND_STATUS.QUEUED, at: submittedAt }],
    };

    this.commands.push(command);
    this.#audit('command_queued', command, {
      message: `Command ${command.id} queued for ${robotId} → ${targetRoute}.`,
    });

    return this.#operatorResponse(command);
  }

  processNext({ now = Date.now(), fail = false } = {}) {
    const command = this.commands.find((candidate) => candidate.status === COMMAND_STATUS.QUEUED);
    if (!command) return null;

    this.#transition(command, COMMAND_STATUS.PROCESSING, { at: now });
    this.#transition(command, fail ? COMMAND_STATUS.FAILED : COMMAND_STATUS.CONFIRMED, {
      at: now + 250,
      reason: fail ? 'Simulated processing failure' : 'Simulated successful route override',
    });

    return this.#operatorResponse(command);
  }

  getQueueSnapshot() {
    return this.commands.map((command) => ({
      id: command.id,
      robotId: command.robotId,
      targetRoute: command.targetRoute,
      operatorRole: command.operatorRole,
      status: command.status,
      latestMessage: command.latestMessage,
    }));
  }

  getAuditLog() {
    return [...this.auditLog];
  }

  #findRecentDuplicate({ operatorId, robotId, targetRoute, submittedAt }) {
    return this.commands.find((command) => {
      const ageMs = submittedAt - command.submittedAt;
      return command.operatorId === operatorId
        && command.robotId === robotId
        && command.targetRoute === targetRoute
        && ageMs >= 0
        && ageMs <= this.duplicateWindowMs
        && ![COMMAND_STATUS.FAILED, COMMAND_STATUS.DUPLICATE_REJECTED].includes(command.status);
    });
  }

  #findActiveConflict({ robotId, targetRoute }) {
    return this.commands.find((command) => command.robotId === robotId
      && command.targetRoute !== targetRoute
      && [COMMAND_STATUS.QUEUED, COMMAND_STATUS.PROCESSING].includes(command.status));
  }

  #recordRejectedCommand({ operatorId, operatorRole, robotId, targetRoute, submittedAt, status, reason, relatedCommandId }) {
    const command = {
      id: this.#nextCommandId(),
      operatorId,
      operatorRole,
      robotId,
      targetRoute,
      submittedAt,
      status,
      latestMessage: reason,
      relatedCommandId,
      history: [{ status, at: submittedAt, reason }],
    };

    this.commands.push(command);
    this.#audit('command_rejected', command, { reason, relatedCommandId });
    return this.#operatorResponse(command);
  }

  #transition(command, status, { at = Date.now(), reason } = {}) {
    command.status = status;
    command.latestMessage = reason || `Command moved to ${status}.`;
    command.history.push({ status, at, reason });
    this.#audit('command_status_changed', command, { status, reason });
  }

  #operatorResponse(command) {
    return {
      commandId: command.id,
      robotId: command.robotId,
      targetRoute: command.targetRoute,
      status: command.status,
      message: command.latestMessage || `Command is ${command.status}.`,
    };
  }

  #audit(eventType, command, metadata = {}) {
    this.auditLog.push({
      eventType,
      commandId: command.id,
      robotId: command.robotId,
      operatorId: command.operatorId,
      operatorRole: command.operatorRole,
      status: command.status,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  #priority(role) {
    return ROLE_PRIORITY[role] || ROLE_PRIORITY.operator;
  }

  #nextCommandId() {
    return `cmd_${String(this.commands.length + 1).padStart(4, '0')}`;
  }

  #requireValue(name, value) {
    if (!value) throw new Error(`${name} is required`);
  }
}

function runShiftChangeDemo() {
  const queue = new CommandQueuePrototype({ duplicateWindowMs: 10_000 });
  const start = Date.now();

  const responses = [
    queue.submitRouteOverride({ operatorId: 'operator-17', robotId: 'robot-42', targetRoute: 'Aisle-7', submittedAt: start }),
    queue.submitRouteOverride({ operatorId: 'operator-17', robotId: 'robot-42', targetRoute: 'Aisle-7', submittedAt: start + 3_000 }),
    queue.submitRouteOverride({ operatorId: 'operator-22', robotId: 'robot-42', targetRoute: 'Dock-3', submittedAt: start + 4_000 }),
    queue.submitRouteOverride({ operatorId: 'supervisor-04', operatorRole: 'supervisor', robotId: 'robot-42', targetRoute: 'Dock-3', submittedAt: start + 5_000 }),
    queue.processNext({ now: start + 6_000 }),
  ];

  return {
    responses,
    queue: queue.getQueueSnapshot(),
    auditLog: queue.getAuditLog(),
  };
}

module.exports = {
  COMMAND_STATUS,
  CommandQueuePrototype,
  runShiftChangeDemo,
};

if (require.main === module) {
  console.log(JSON.stringify(runShiftChangeDemo(), null, 2));
}
