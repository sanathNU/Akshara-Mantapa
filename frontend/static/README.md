# Static Assets

Place images and other static files in this directory.

## Adding Images to the About Page

1. **Place your images here** in the `static/` folder
   - Example: `static/library-visual.jpg`

2. **Edit the About page** at `src/routes/about/+page.svelte`

3. **Add images to the array** at the top of the file:
   ```javascript
   const images = [
     { src: '/library-visual.jpg', alt: 'Library visualization', caption: 'The infinite library' },
     { src: '/borges-portrait.jpg', alt: 'Jorge Luis Borges', caption: 'Jorge Luis Borges' },
     // Add more images...
   ];
   ```

4. **Reference with leading slash**: Images in `static/` are served from the root URL, so use `/image-name.jpg`

## File Naming

- Use lowercase names with hyphens: `library-visual.jpg`
- Supported formats: `.jpg`, `.png`, `.webp`, `.gif`, `.svg`

## Example

If you place an image at:
```
static/kannada-manuscript.jpg
```

Reference it as:
```javascript
{ src: '/kannada-manuscript.jpg', alt: 'Ancient Kannada manuscript', caption: 'A page from history' }
```
