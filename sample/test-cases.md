# Document Title

## Basic Headers and Content

## First Level (h2)
This content should be indented one level.
More content at the first level.

### Second Level (h3)
This content should be indented two levels.
Another line at second level.

#### Third Level (h4)
This content should be indented three levels.

##### Fourth Level (h5)
This content should be indented four levels.

###### Fifth Level (h6)
This content should be indented five levels.

## Header Level Changes

## First Level Again
Content at first level.
### Jump to Third
Content at third level.
##### Jump to Fifth
Content at fifth level - this tests jumping header levels.
### Back to Third
Content at third level - this tests decreasing header levels.

## Lists and Content

## Header With List
- List item 1
  - Nested list item
    - Deep nested item
- List item 2
  This is content under list item 2
  It should maintain list indentation

## Mixed Content Types

## Header With Mixed Content
Regular paragraph text.
- List item
> Blockquote
```javascript
// Code block
const x = 1;
```
1. Numbered list
   > Nested blockquote
   ```python
   # Nested code
   def fn():
       pass
   ```

## Edge Cases

#Not a header (no space)
###### Fifth Level Header
Content right after a max level header.

## Empty Headers

## 
Content under an empty header.

### Second Empty
###### 
Content under empty max level header.

## Whitespace Tests

##     Extra Spaced Header
Content under a header with extra spaces.

###    Second Extra Space
Content under second level with extra spaces. 
