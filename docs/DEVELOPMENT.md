# Doomsidian Development Notes

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

### Extension Management in Tests

When testing CodeMirror extensions:

1. Don't try to access `view.state.extensions` directly - it's not accessible
2. Instead, explicitly provide the extensions array when creating the editor state:

```typescript
EditorState.create({
    doc: content,
    extensions: [
        markdown(),
        headerIndentation(settings)
    ]
})
```

### Visual Stability

To maintain visual stability in the editor:

1. Prefer replacing text with fixed-width characters or spaces over hiding with CSS
2. When using widgets, ensure they have consistent width and positioning
3. Use `ch` units for text-related measurements to maintain proportional spacing
4. Consider the impact of decorations on cursor movement and selection

### Performance Considerations

1. Only recompute decorations when necessary (document changes or viewport changes)
2. Use efficient matching patterns for text analysis
3. Cache computed values where possible
4. Consider using `WeakMap` for storing decoration-related data

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

## Known Issues and Solutions

1. **Decoration Jumping**: Fixed by proper decoration ordering and consistent widget positioning
2. **Header Marker Concealment**: Solved by using replace decorations instead of CSS visibility
3. **Indentation Stability**: Achieved through careful management of text-indent and margins

## Future Improvements

1. Consider adding more header styles/bullets
2. Improve performance for large documents
3. Add support for folding/unfolding header sections
4. Consider adding custom styling options for different header levels 
