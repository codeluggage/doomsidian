# Doomsidian Development Notes

## Test Environment

The project includes a test vault at `test-vault/` that contains sample content for testing various features. This vault is used for:
- Testing markdown rendering and formatting
- Verifying header indentation behavior
- Testing tag-related features
- Other plugin functionality testing

## CodeMirror Gotchas and Best Practices

### Decoration Ordering

CodeMirror requires decorations to be added in a specific order to work correctly. When creating decorations:

1. Decorations must be sorted by their `from` position in ascending order
2. For decorations at the same position, they must be sorted by their `startSide` value
3. Use the following pattern to ensure proper ordering:

```typescript
return Decoration.set(decorations.sort((a, b) => {
    const fromDiff = a.from - b.from;
    if (fromDiff) return fromDiff;
    return (a.value.startSide || 0) - (b.value.startSide || 0);
}));
```

### Header Indentation Challenges

When implementing header-based indentation:

1. **Decoration Types**:
   - Line decorations (`padding-left`) can interfere with list indentation
   - `margin-left` works better with CodeMirror's native list handling
   - Class-based decorations are more stable than inline styles

2. **List Interaction**:
   - Let CodeMirror handle list indentation natively
   - Avoid interfering with tab/shift-tab behavior
   - Consider list markers when calculating indentation

3. **Quote Handling**:
   - Vertical bars need special consideration
   - Let CodeMirror handle quote structure
   - Add indentation without breaking quote markers

4. **Empty Lines**:
   - Must maintain header level context
   - Don't break on empty lines between content
   - Consider header hierarchy when determining level

5. **Vim Mode Compatibility**:
   - Avoid absolute positioning that breaks line calculations
   - Use simple class-based decorations where possible
   - Test with cursor movement commands

### Widget and Replace Decorations

When using both widget and replace decorations at the same position:

1. Widget decorations should come before replace decorations
2. Set `side: -1` on widget decorations to ensure proper placement:

```typescript
// Add widget first
Decoration.widget({
    widget: myWidget,
    side: -1  // Places before other decorations
}).range(pos)

// Then add replace decoration
Decoration.replace({
    inclusive: true
}).range(pos, endPos)
```

### Visual Stability

To maintain visual stability in the editor:

1. Prefer class-based decorations over inline styles
2. Consider the interaction between different decoration types
3. Use `ch` units for text-related measurements
4. Test with various content types:
   - Mixed lists (ordered, unordered, tasks)
   - Nested quotes
   - Empty lines
   - Headers at different levels

### Performance Considerations

1. Only recompute decorations when necessary
2. Cache header level calculations where possible
3. Minimize DOM operations and style changes
4. Consider using WeakMap for decoration data

## Known Issues and Solutions

1. **Header Indentation vs Lists**:
   - Challenge: Header indentation interferes with list behavior
   - Current approach: Use margin-left and let CodeMirror handle lists
   - Remaining issue: Tab/Shift-tab behavior needs improvement

2. **Quote Rendering**:
   - Challenge: Maintaining quote markers and vertical bars
   - Current approach: Let CodeMirror handle quote structure
   - Status: Partially solved, needs refinement

3. **Mixed Content**:
   - Challenge: Different content types need different handling
   - Current approach: Content-type specific classes
   - Status: Works for basic cases, complex nesting needs work

4. **Vim Mode**:
   - Challenge: Decorations breaking cursor movement
   - Solution: Use simpler class-based decorations
   - Status: Fixed for basic movement

## Future Improvements

1. Investigate better list indentation handling
2. Improve quote marker stability
3. Refine mixed content behavior
4. Consider alternative approaches:
   - CodeMirror language extension
   - Native indentation integration
   - Custom indent handling

## Plugin Architecture

### State Management

The plugin uses CodeMirror's ViewPlugin system to:
1. Track header levels and indentation
2. Manage decorations for visual styling
3. Handle document updates efficiently

### Extension Configuration

The plugin accepts configuration through the `HeaderIndentationSettings` interface:
```typescript
interface HeaderIndentationSettings {
    ignoreH1Headers: boolean;
    indentationWidth: number;
}
```

## Testing Strategy

1. Test header detection and level calculation
2. Verify decoration ordering and positioning
3. Check indentation calculations
4. Ensure proper handling of edge cases:
   - Empty headers
   - Headers without space after hashtags
   - Mixed content under headers
   - Nested structures (lists, quotes)
