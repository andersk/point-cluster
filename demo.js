'use strict'

const createCluster = require('./')
const getContext = require('get-canvas-context')
const panZoom = require('pan-zoom')
const createLoop = require('canvas-loop')
const createFps = require('fps-indicator')


//data points
let N = 1e5
let points = Array(N*2).fill(null).map(_ => [Math.random(), Math.random()])


//create cluster
let cluster = createCluster(points, {
	minZoom: 0,
	maxZoom: 16,
	radius: 5,
	nodeSize: 64
})


//rendering loop

let ctx = getContext('2d')
let canvas = ctx.canvas
document.body.appendChild(canvas)

let app = createLoop(canvas)

app.start()

app.on('tick', dt => {
	render()
})

app.on('resize', _ => {
})

//set zoom params
let scale = canvas.width, offset = [0, 0]
let dirty = true

let fps = createFps()
fps.element.style.fontFamily = `sans-serif`
fps.element.style.top = `1rem`
fps.element.style.right = `1rem`

function toPx(v) {
	return v * scale
}
function fromPx(v, s) {
	return v / s
}

//interactions
panZoom(canvas, e => {
	let w = canvas.width
	let h = canvas.height

	offset[0] += fromPx(e.dx, scale)
	offset[1] += fromPx(e.dy, scale)

	let prevScale = scale
	scale -= scale * e.dz / w

	let rx = e.x / w
	let ry = e.y / h

	offset[0] += fromPx(e.x, scale) - fromPx(e.x, prevScale)
	offset[1] += fromPx(e.y, scale) - fromPx(e.y, prevScale)

	dirty = true
})


function render () {
	if (!dirty) return
	dirty = false

	let w = canvas.width
	let h = canvas.height
	let box = [
		-offset[0], -offset[1],
		fromPx(w, scale),
		fromPx(h, scale)
		// scale / w, scale / w
	]

	let zoom = Math.log2(scale)
	let clusters = cluster.getClusters(box, zoom)

	if (clusters.length > 1e5) throw 'Too many clusters: ' + clusters.length
	ctx.clearRect(0,0,w,h)

	let diameter = 10
	let opacity = .75

	for (let i = 0; i < clusters.length; i++) {
		let cluster = clusters[i]
		let x = cluster.x
		let y = cluster.y

		let opaque = Math.pow((1 - opacity), Math.min(3, cluster.numPoints + 1))
		ctx.fillStyle = `rgba(0,100,200,${(1 - opaque).toFixed(2)})`;

		ctx.beginPath()
		ctx.arc(toPx(x + offset[0]), toPx(y + offset[1]), diameter/2, 0, 2 * Math.PI)
		ctx.closePath()

		ctx.fill();
	}


	//render initial points
	// ctx.fillStyle = 'rgba(0,200,100,.5)';
	// let pd = 2

	// for (let i = 0; i < points.length; i++) {
	// 	let point = points[i]
	// 	let x = point[0]
	// 	let y = point[1]

	// 	ctx.beginPath()
	// 	ctx.arc(x * scale + offset[0], y * scale + offset[1], pd/2, 0, 2 * Math.PI)
	// 	ctx.closePath()

	// 	ctx.fill();
	// }
}

