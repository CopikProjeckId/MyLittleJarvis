// JARVIS Diff Engine
// Generate and apply diffs for file editing

// ============================================================
// Simple Diff Implementation (no external dependencies)
// ============================================================

export class DiffEngine {
  /**
   * Create a unified diff between two strings
   */
  createUnifiedDiff(original, modified, filename = 'file') {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');

    const hunks = this.computeHunks(origLines, modLines);

    if (hunks.length === 0) {
      return ''; // No changes
    }

    let diff = `--- a/${filename}\n+++ b/${filename}\n`;

    for (const hunk of hunks) {
      diff += `@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@\n`;
      diff += hunk.lines.join('\n') + '\n';
    }

    return diff;
  }

  /**
   * Compute diff hunks using simple LCS algorithm
   */
  computeHunks(origLines, modLines, context = 3) {
    const changes = this.diff(origLines, modLines);
    const hunks = [];

    let currentHunk = null;
    let oldLine = 1;
    let newLine = 1;
    let lastChangeIdx = -999;

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];

      if (change.type !== 'equal') {
        // Start new hunk if needed
        if (!currentHunk || i - lastChangeIdx > context * 2) {
          if (currentHunk) {
            // Add trailing context to previous hunk
            this.addContext(currentHunk, changes, lastChangeIdx + 1, Math.min(lastChangeIdx + context + 1, i));
            hunks.push(currentHunk);
          }

          currentHunk = {
            oldStart: Math.max(1, oldLine - context),
            newStart: Math.max(1, newLine - context),
            oldCount: 0,
            newCount: 0,
            lines: []
          };

          // Add leading context
          this.addContext(currentHunk, changes, Math.max(0, i - context), i);
        }

        // Add change
        if (change.type === 'remove') {
          currentHunk.lines.push('-' + change.value);
          currentHunk.oldCount++;
        } else if (change.type === 'add') {
          currentHunk.lines.push('+' + change.value);
          currentHunk.newCount++;
        }

        lastChangeIdx = i;
      }

      // Track line numbers
      if (change.type === 'equal' || change.type === 'remove') {
        oldLine++;
      }
      if (change.type === 'equal' || change.type === 'add') {
        newLine++;
      }
    }

    // Finalize last hunk
    if (currentHunk) {
      this.addContext(currentHunk, changes, lastChangeIdx + 1, Math.min(lastChangeIdx + context + 1, changes.length));
      hunks.push(currentHunk);
    }

    return hunks;
  }

  addContext(hunk, changes, start, end) {
    for (let i = start; i < end; i++) {
      if (changes[i] && changes[i].type === 'equal') {
        hunk.lines.push(' ' + changes[i].value);
        hunk.oldCount++;
        hunk.newCount++;
      }
    }
  }

  /**
   * Simple diff algorithm (not optimal but works)
   */
  diff(oldArr, newArr) {
    const result = [];
    const oldSet = new Set(oldArr);
    const newSet = new Set(newArr);

    let oldIdx = 0;
    let newIdx = 0;

    while (oldIdx < oldArr.length || newIdx < newArr.length) {
      if (oldIdx >= oldArr.length) {
        // Remaining new lines are additions
        result.push({ type: 'add', value: newArr[newIdx] });
        newIdx++;
      } else if (newIdx >= newArr.length) {
        // Remaining old lines are deletions
        result.push({ type: 'remove', value: oldArr[oldIdx] });
        oldIdx++;
      } else if (oldArr[oldIdx] === newArr[newIdx]) {
        // Equal lines
        result.push({ type: 'equal', value: oldArr[oldIdx] });
        oldIdx++;
        newIdx++;
      } else if (!newSet.has(oldArr[oldIdx])) {
        // Old line was removed
        result.push({ type: 'remove', value: oldArr[oldIdx] });
        oldIdx++;
      } else if (!oldSet.has(newArr[newIdx])) {
        // New line was added
        result.push({ type: 'add', value: newArr[newIdx] });
        newIdx++;
      } else {
        // Both lines exist elsewhere - treat as remove then add
        result.push({ type: 'remove', value: oldArr[oldIdx] });
        result.push({ type: 'add', value: newArr[newIdx] });
        oldIdx++;
        newIdx++;
      }
    }

    return result;
  }

  /**
   * Get line-by-line diff for display
   */
  getLineDiff(original, modified) {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    const changes = this.diff(origLines, modLines);

    let oldLineNum = 1;
    let newLineNum = 1;

    return changes.map(change => {
      const result = {
        type: change.type,
        content: change.value
      };

      if (change.type === 'equal') {
        result.oldLine = oldLineNum++;
        result.newLine = newLineNum++;
      } else if (change.type === 'remove') {
        result.oldLine = oldLineNum++;
      } else if (change.type === 'add') {
        result.newLine = newLineNum++;
      }

      return result;
    });
  }

  /**
   * Apply a simple patch (replace old_string with new_string)
   */
  applyEdit(content, oldString, newString, replaceAll = false) {
    if (!content.includes(oldString)) {
      return {
        success: false,
        error: 'old_string not found in content'
      };
    }

    const count = (content.match(new RegExp(this.escapeRegex(oldString), 'g')) || []).length;

    if (!replaceAll && count > 1) {
      return {
        success: false,
        error: `old_string found ${count} times. Use replaceAll or provide more context`,
        occurrences: count
      };
    }

    const newContent = replaceAll
      ? content.split(oldString).join(newString)
      : content.replace(oldString, newString);

    return {
      success: true,
      content: newContent,
      replacements: replaceAll ? count : 1,
      diff: this.createUnifiedDiff(content, newContent)
    };
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get stats about changes
   */
  getStats(original, modified) {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    const changes = this.diff(origLines, modLines);

    const additions = changes.filter(c => c.type === 'add').length;
    const deletions = changes.filter(c => c.type === 'remove').length;
    const unchanged = changes.filter(c => c.type === 'equal').length;

    return {
      additions,
      deletions,
      unchanged,
      totalOld: origLines.length,
      totalNew: modLines.length,
      changed: additions > 0 || deletions > 0
    };
  }
}

// Singleton instance
export const diffEngine = new DiffEngine();

export default DiffEngine;
