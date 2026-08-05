/**
 * Role-Based Route Override Controls Prototype
 *
 * Demo-only logic for the Acme Robotics PRD:
 * "Role-Based Route Override Controls".
 */

const OUTCOME = Object.freeze({
  APPROVED: 'Approved',
  NEEDS_APPROVAL: 'Needs approval',
  DENIED: 'Denied',
  SAFETY_OVERRIDE: 'Safety override',
});

const DEFAULT_POLICY = Object.freeze({
  operator: {
    suggest_reroute: OUTCOME.APPROVED,
    execute_reroute: OUTCOME.NEEDS_APPROVAL,
    priority_override: OUTCOME.DENIED,
    emergency_override: OUTCOME.DENIED,
  },
  supervisor: {
    suggest_reroute: OUTCOME.APPROVED,
    execute_reroute: OUTCOME.APPROVED,
    priority_override: OUTCOME.APPROVED,
    emergency_override: OUTCOME.NEEDS_APPROVAL,
  },
  safety_officer: {
    suggest_reroute: OUTCOME.APPROVED,
    execute_reroute: OUTCOME.APPROVED,
    priority_override: OUTCOME.APPROVED,
    emergency_override: OUTCOME.SAFETY_OVERRIDE,
  },
});

class RouteOverrideAuthorizer {
  constructor(policy = DEFAULT_POLICY) {
    this.policy = policy;
    this.auditLog = [];
  }

  evaluate({ actorId, role, robotId, targetRoute, action, reason, timestamp = new Date().toISOString() }) {
    this.#requireValue('actorId', actorId);
    this.#requireValue('role', role);
    this.#requireValue('robotId', robotId);
    this.#requireValue('targetRoute', targetRoute);
    this.#requireValue('action', action);

    const rolePolicy = this.policy[role];
    const outcome = rolePolicy?.[action] || OUTCOME.DENIED;
    const decision = {
      decisionId: this.#nextDecisionId(),
      actorId,
      role,
      robotId,
      targetRoute,
      action,
      outcome,
      reason: reason || this.#defaultReason({ role, action, outcome }),
      timestamp,
    };

    this.auditLog.push({
      eventType: 'route_override_authorization_decision',
      ...decision,
    });

    return decision;
  }

  getAuditLog() {
    return [...this.auditLog];
  }

  getPolicySummary() {
    return Object.entries(this.policy).map(([role, permissions]) => ({ role, permissions }));
  }

  #defaultReason({ role, action, outcome }) {
    if (outcome === OUTCOME.DENIED) return `${role} is not permitted to ${action}.`;
    if (outcome === OUTCOME.NEEDS_APPROVAL) return `${action} requires higher-level approval for ${role}.`;
    if (outcome === OUTCOME.SAFETY_OVERRIDE) return `${role} can execute emergency override with audit trail.`;
    return `${role} is permitted to ${action}.`;
  }

  #nextDecisionId() {
    return `decision_${String(this.auditLog.length + 1).padStart(4, '0')}`;
  }

  #requireValue(name, value) {
    if (!value) throw new Error(`${name} is required`);
  }
}

function runAuthorizationDemo() {
  const authorizer = new RouteOverrideAuthorizer();
  const scenarios = [
    {
      actorId: 'operator-17',
      role: 'operator',
      robotId: 'robot-42',
      targetRoute: 'Aisle-7',
      action: 'suggest_reroute',
      reason: 'Operator notices blocked aisle.',
    },
    {
      actorId: 'operator-17',
      role: 'operator',
      robotId: 'robot-42',
      targetRoute: 'Aisle-7',
      action: 'execute_reroute',
      reason: 'Operator tries to execute without approval.',
    },
    {
      actorId: 'supervisor-04',
      role: 'supervisor',
      robotId: 'robot-42',
      targetRoute: 'Dock-3',
      action: 'priority_override',
      reason: 'Supervisor resolves route conflict during shift change.',
    },
    {
      actorId: 'safety-02',
      role: 'safety_officer',
      robotId: 'robot-42',
      targetRoute: 'Safe-Zone',
      action: 'emergency_override',
      reason: 'Safety officer clears robot from active hazard area.',
    },
    {
      actorId: 'contractor-99',
      role: 'contractor',
      robotId: 'robot-13',
      targetRoute: 'Dock-1',
      action: 'priority_override',
      reason: 'Unknown role attempts priority override.',
    },
  ];

  const decisions = scenarios.map((scenario) => authorizer.evaluate(scenario));

  return {
    policy: authorizer.getPolicySummary(),
    decisions,
    auditLog: authorizer.getAuditLog(),
  };
}

module.exports = {
  OUTCOME,
  DEFAULT_POLICY,
  RouteOverrideAuthorizer,
  runAuthorizationDemo,
};

if (require.main === module) {
  console.log(JSON.stringify(runAuthorizationDemo(), null, 2));
}
