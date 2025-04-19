# Level 1 Header
Content under level 1
## Level 2 Header
Content under level 2
### Level 3 Header
Content under level 3
#### Level 4 Header
Content under level 4
##### Level 5 Header
Content under level 5
###### Level 6 Header
Content under level 6
## Text Formatting

**Bold text**
*Italic text*
***Bold and italic text***
~~Strikethrough text~~
==Highlighted text==
`Inline code`

## Lists and Nesting

- Unordered list item 1
  - Nested unordered item 1.1
    - Deeply nested item 1.1.1
      - Even deeper nesting 1.1.1.1
  - Nested unordered item 1.2
- Unordered list item 2

1. Ordered list item 1
   2. Nested ordered item 1.1
      1. Deeply nested ordered 1.1.1
   3. Nested ordered item 1.2
4. Ordered list item 2

- Mixed list with **formatted text**
  - [ ] Unchecked task
  - [x] Completed task
    - [ ] Nested task unchecked
    - [x] Nested task completed

## Blockquotes and Nesting

> First level quote
> Still in first level
>> Second level quote
>> Continuing second level
>>> Third level quote
> Back to first level

## Code Blocks with Syntax Highlighting

```javascript
function example() {
  const test = "This should be syntax highlighted";
  return test;
}
````

```python
def example():
    test = "Python syntax"
    return test
```

```css
.class {
  color: #51afef;
  margin-left: 1.5rem;
}
```

## Tables

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Bold     | _Italic_ | `Code`   |

| Left-aligned | Center | Right-aligned |
| :----------- | :----: | ------------: |
| Left         | Center |         Right |

## Mixed Elements Under Headers

### Tasks and Mixed Content Example

This paragraph has **bold**, _italic_, and `code` mixed together.

- [ ] Task 1 with internal link to [[existing note]]
    - [ ] Subtask with ==highlighted text==
- [x] Completed task with [external link](https://example.com/)

> Blockquote under a level 3 header With **formatting** inside

## Obsidian-Specific Features

^block-reference

%%Comment that shouldn't be styled in preview%%

- [ ] #tag-in-task
- [x] Task with @person

==Highlights== with [[existing note|custom display text]]

![[existing note]]

```dataview
TABLE tags AS "Tags" FROM #tag-in-task
```

## Callouts

> [!NOTE] This is a note callout

> [!WARNING] This is a warning callout

> [!INFO] This is an info callout

> [!TIP] This is a tip callout

> [!IMPORTANT] This is an important callout

> [!CAUTION] This is a caution callout

> [!FAILURE] This is a failure callout

> [!ERROR] This is an error callout

> [!BUG] This is a bug callout

> [!EXAMPLE] This is an example callout

> [!QUOTE] This is a quote callout

## Advanced Formatting

Footnote reference[^1]

[^1]: This is a footnote.

~~_Formatted_ **inside** ==another format==~~

Term : Definition for the term : Another definition

## Horizontal rule:

## Mathematical Notation

Inline formula: $E = mc^2$

Block formula: $$ \frac{d}{dx}e^x = e^x $$

## Embedded Content Examples

![External image](https://example.com/image.jpg)

This example would include embedded content if the files existed: ![[image.png]]
## Level 2 with Checkboxes

- [ ] Level 2 task 1
- [x] Level 2 task 2

### Level 3 with Checkboxes

- [ ] Level 3 task 1
- [x] Level 3 task 2

#### Level 4 with Checkboxes

- [ ] Level 4 task 1
- [x] Level 4 task 2

## Combination Elements

### Nested Lists with Links and Formatting

- First level
    - Second level with **bold**
        - Third level with [[internal link]]
            - Fourth level with ==highlight==
                - Fifth level with `code block`
                    - Sixth level with _italic_