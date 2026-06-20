import {
  resolveBlockedTaskIdsFromEdges,
  wouldCreateDependencyCycle,
} from './task-dependency.utils';

describe('task-dependency.utils', () => {
  describe('resolveBlockedTaskIdsFromEdges', () => {
    it('marks successors blocked by incomplete predecessors', () => {
      const blockedTaskIds = resolveBlockedTaskIdsFromEdges(['task-a', 'task-b'], [
        {
          predecessorTaskId: 'task-pre',
          successorTaskId: 'task-a',
          predecessorCompleted: false,
        },
        {
          predecessorTaskId: 'task-done',
          successorTaskId: 'task-b',
          predecessorCompleted: true,
        },
      ]);

      expect(blockedTaskIds.has('task-a')).toBe(true);
      expect(blockedTaskIds.has('task-b')).toBe(false);
    });
  });

  describe('wouldCreateDependencyCycle', () => {
    it('detects cycles when linking tasks', () => {
      const wouldCycle = wouldCreateDependencyCycle(
        [
          {
            predecessorTaskId: 'a',
            successorTaskId: 'b',
            predecessorCompleted: false,
          },
        ],
        'b',
        'a',
      );

      expect(wouldCycle).toBe(true);
    });
  });
});
