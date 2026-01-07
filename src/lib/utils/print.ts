/**
 * Prints an image element using CSS @media print.
 * Temporarily marks the image as print target, sets page orientation
 * based on image dimensions, triggers print dialog, then cleans up.
 */
export function printImage(imageElement: HTMLImageElement): void {
	// Detect orientation from image dimensions
	const isLandscape = imageElement.naturalWidth > imageElement.naturalHeight
	const orientation = isLandscape ? "landscape" : "portrait"

	// Inject dynamic page orientation style
	const styleEl = document.createElement("style")
	styleEl.id = "print-orientation-style"
	styleEl.textContent = `@page { size: ${orientation}; }`
	document.head.appendChild(styleEl)

	// Mark image for printing
	imageElement.classList.add("print-target")

	const cleanup = () => {
		imageElement.classList.remove("print-target")
		styleEl.remove()
		window.removeEventListener("afterprint", cleanup)
	}

	window.addEventListener("afterprint", cleanup)
	window.print()
}
