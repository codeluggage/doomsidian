# Header Indentation Solution

## The Challenge
The header indentation feature needed to handle multiple types of content while maintaining proper indentation hierarchy:
- Regular text content under headers
- List items (both ordered and unordered)
- Blockquotes
- Tables and other elements

The main complexity came from managing state transitions between different content types and handling empty lines correctly.

## Key Insights

### 1. Content Type Independence
Initially, we tried to track content types explicitly (header, list, text, empty) but this made the logic overly complex. The breakthrough came from realizing that:
- Lists and blockquotes should use Obsidian's native indentation
- Only regular content needs our custom header-based indentation
- Empty lines should only reset indentation in specific contexts

### 2. State Management
The final solution uses minimal state tracking:
```typescript
let activeHeaderLevel = 0;
let lastHeaderLevel = 0;
let consecutiveEmptyLines = 0;
```

This simplified state made the logic more robust and easier to reason about.

### 3. List Detection
Lists are detected using a regex pattern:
```typescript
const isListItem = text.match(/^[\s]*([-*+]|\d+\.)\s/);
```

### 4. Empty Line Handling
The critical insight for empty lines was to only reset header levels when:
1. Multiple consecutive empty lines are encountered
2. We're not in a list or blockquote context
```typescript
if (emptyLineCount > 1 && !inListBlock && !inBlockquote) {
    activeHeaderLevel = 0;
}
```

## The Solution

The final solution in `src/header-indentation.ts` follows these principles:

1. **Header Detection**: Headers set both the active and last header levels
2. **List Handling**: 
   - Lists are detected but not modified by our indentation
   - Being in a list preserves header level across empty lines
3. **Empty Line Logic**:
   - Single empty lines don't affect indentation
   - Multiple empty lines only reset indentation outside lists/blockquotes
4. **Indentation Application**:
   - Only applied to regular content
   - Uses padding-left with !important to ensure consistency
   - Preserves Obsidian's native handling of special elements

## Results
The solution successfully:
- Maintains proper indentation hierarchy under headers
- Preserves list formatting and indentation
- Handles empty lines without disrupting content structure
- Works with blockquotes and other special elements
- Integrates smoothly with Obsidian's native styling

## Future Considerations

### Current Limitations
The plugin currently doesn't handle indentation for:
- Tables
- Code blocks
- Task lists with mixed content
- Embedded content (images, PDFs, etc.)
- Multi-line formatting (like block quotes with lists inside)

### Extension Strategy

#### 1. Element Analysis
For each new element type, analyze:
- Its native Obsidian rendering behavior
- How it interacts with existing indentation
- Whether it contains nested elements
- Its position in the document hierarchy

#### 2. Detection Patterns
Add detection for new elements using:
```typescript
// Tables
const isTable = text.match(/^\s*\|.*\|/);

// Code blocks
const isCodeBlock = text.match(/^\s*```/);

// Task lists
const isTaskList = text.match(/^\s*- \[[ x]\]/i);

// Embedded content
const isEmbed = text.match(/^\s*!\[\[.*\]\]/);
```

#### 3. Implementation Approaches

##### Tables
1. Detect table boundaries (start/end)
2. Track table state during parsing
3. Apply indentation to the entire table block
```typescript
if (isTable && activeHeaderLevel > 0) {
    // Apply indentation to table container
    decorations.push(Decoration.line({
        attributes: {
            style: `padding-left: ${indent}ch !important`
        }
    }).range(line.from));
}
```

##### Code Blocks
1. Add code block state tracking
2. Preserve internal formatting
3. Apply indentation to the container
```typescript
let inCodeBlock = false;
// ... in the parsing loop ...
if (isCodeBlockStart) {
    inCodeBlock = !inCodeBlock;
    if (activeHeaderLevel > 0) {
        // Apply container indentation
    }
}
```

##### Mixed Content
For elements that can contain mixed content types:
1. Implement a stack-based state tracker
2. Track parent-child relationships
3. Apply indentation rules based on context
```typescript
interface ContentState {
    type: 'list' | 'blockquote' | 'table' | 'code';
    level: number;
    parent?: ContentState;
}
```

#### 4. Testing Strategy
For each new element type:
1. Create test documents with:
   - The element in isolation
   - The element under different header levels
   - The element with mixed content
   - Edge cases (empty lines, transitions)
2. Verify:
   - Correct indentation application
   - Preservation of element formatting
   - Proper interaction with other elements
   - Performance impact

#### 5. Performance Considerations
- Cache detection results for repeated patterns
- Optimize regex patterns for common cases
- Consider batch processing for large documents
```typescript
// Example optimization
const elementCache = new Map<string, ElementType>();
const getCachedElementType = (text: string) => {
    if (elementCache.has(text)) return elementCache.get(text);
    const type = detectElementType(text);
    elementCache.set(text, type);
    return type;
};
```

### Implementation Priority
Suggested order for implementing new elements:
1. Tables (most requested, relatively straightforward)
2. Code blocks (contained, predictable structure)
3. Task lists with mixed content (builds on existing list handling)
4. Embedded content (less common, but important for completeness)
5. Complex nested structures (most challenging, requires careful state management)

### Architecture Evolution
As more elements are added:
1. Consider refactoring to a plugin system for element handlers
2. Implement a more sophisticated state management system
3. Add configuration options for element-specific behavior
```typescript
interface ElementHandler {
    detect: (text: string) => boolean;
    getIndentation: (state: ParserState) => number;
    applyDecoration: (view: EditorView, line: Line) => Decoration[];
}
```

This extensible architecture will make it easier to:
- Add new element handlers
- Configure behavior per element type
- Maintain clean separation of concerns
- Test individual components
