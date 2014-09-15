SQUARE_WIDTH = 50
ANIMATION_TICK = 100

showGraph = true
globalAnimationTimeout = null

class Path
  constructor: (@data, @prev) ->

  toArray: ->
    array = []
    head = @
    until head is null
      array.unshift(head.data)
      head = head.prev

    return array

class Graph
  constructor: (@nodes = []) ->

  findShortestPath: (first, last) ->
    visited = {}
    paths = [new Path(first, null)]

    while true
      ex = paths.shift()
      for node in ex.data.nodes when not visited[node.id] and not node.blocked
        visited[node.id] = true
        if node is last
          return (new Path(last, ex)).toArray()
        else
          paths.push new Path node, ex

      if paths.length is 0
        break

    return null

  animateShortestPath: (first, last, callback = (->), paths = [new Path(first, null)], visited = {}) ->
    ex = paths.shift()
    for node in ex.data.nodes when not visited[node.id] and not node.blocked
      visited[node.id] = true
      if node is last
        callback (new Path(last, ex)).toArray()
        return
      else
        paths.push new Path node, ex

    drawAnimation first, last, paths, visited

    if paths.length is 0
      callback null
    else
      globalAnimationTimeout = setTimeout (=>
        @animateShortestPath first, last, callback, paths, visited
      ), ANIMATION_TICK

_node_id = 0
class Node
  constructor: (@data, @nodes) ->
    @id = _node_id++

getAdjacency = (i, j) ->
  [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1],
   [i + 1, j + 1], [i - 1, j - 1], [i + 1, j - 1], [i - 1, j + 1]]

class Chessboard extends Graph
  constructor: ->
    super

    @board = for i in [0...8]
      for j in [0...8]
        new Node [i, j], []

    for row, i in @board
      for cell, j in row
        for coord in getAdjacency i, j
          if @board[coord[0]]?[coord[1]]?
            cell.nodes.push @board[coord[0]][coord[1]]

    for row, i in @board
      for cell, j in row
        @nodes.push cell

board = new Chessboard()

canvas = document.querySelector 'canvas'
ctx = canvas.getContext '2d'

canvas.width = canvas.height = 8 * SQUARE_WIDTH

redrawBoard = (visited = {}) ->
  ctx.clearRect 0, 0, canvas.width, canvas.height
  for i in [0...8]
    for j in [0...8]
      if board.board[i][j].blocked
        ctx.fillStyle = '#f00'
      else if visited[board.board[i][j].id]
        ctx.fillStyle = if ((i + j) % 2) is 0 then '#553' else '#DDA'
      else
        ctx.fillStyle = if ((i + j) % 2) is 0 then '#888' else '#DDD'
      ctx.fillRect i * SQUARE_WIDTH, j * SQUARE_WIDTH, SQUARE_WIDTH, SQUARE_WIDTH

  if showGraph
    ctx.strokeStyle = '#00f'
    ctx.globalAlpha = 0.1
    for i in [0...8]
      for j in [0...8] when not board.board[i][j].blocked
        for node in board.board[i][j].nodes when not node.blocked
          ctx.beginPath()
          ctx.moveTo (i + 0.5) * SQUARE_WIDTH, (j + 0.5)* SQUARE_WIDTH
          ctx.lineTo (node.data[0] + 0.5) * SQUARE_WIDTH, (node.data[1] + 0.5) * SQUARE_WIDTH
          ctx.stroke()
    ctx.globalAlpha = 1


redrawBoard()

drawPath_raw = (path) ->

  unless path? then return

  ctx.beginPath()
  ctx.strokeStyle = '#f00'
  ctx.lineWidth = 2
  ctx.fillStyle = '#f00'

  for coord, i in path
    if i is 0
      ctx.moveTo (coord[0] + 0.5) * SQUARE_WIDTH, (coord[1] + 0.5) * SQUARE_WIDTH
    else
      ctx.lineTo (coord[0] + 0.5) * SQUARE_WIDTH, (coord[1] + 0.5) * SQUARE_WIDTH

    ctx.fillRect (coord[0] + 0.45) * SQUARE_WIDTH, (coord[1] + 0.45) * SQUARE_WIDTH,
      SQUARE_WIDTH * 0.1, SQUARE_WIDTH * 0.1

  ctx.stroke()

drawPath = (path) ->
  redrawBoard()

  drawPath_raw path

drawAnimation = (first, last, paths, visited) ->
  redrawBoard visited
  for path in paths
    drawPath_raw path.toArray().map (node) -> node.data

reanimate = ->
  if globalAnimationTimeout?
    clearTimeout globalAnimationTimeout

  board.animateShortestPath(board.board[0][0], board.board[7][7], ((path) ->
    drawPath path?.map (node) -> node.data
  ))

canvas.addEventListener 'click', (event) ->
  redrawBoard()

  [x, y] = [Math.floor(event.offsetX / SQUARE_WIDTH), Math.floor(event.offsetY / SQUARE_WIDTH)]

  board.board[x][y].blocked ^= true

  reanimate()

fps = document.querySelector '#speed'

fps.addEventListener 'input', (event) ->
  ANIMATION_TICK = 1000 / Number @value

selector = document.querySelector '#presets'

customer = document.querySelector '#custom-rule'

selector.addEventListener 'change', (event) ->
  customer.style.display = 'none'
  switch @value
    when 'king'
      getAdjacency = (i, j) ->
        [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1],
         [i + 1, j + 1], [i - 1, j - 1], [i + 1, j - 1], [i - 1, j + 1]]
    when 'knight'
      getAdjacency = (i, j) ->
        [[i + 1, j + 2], [i - 1, j + 2], [i + 2, j + 1], [i + 2, j - 1],
         [i + 1, j - 2], [i - 1, j - 2], [i - 2, j - 1], [i - 2, j + 1]]
    when 'custom'
      customer.style.display = 'block'

  recreateBoard()
  reanimate()

applier = document.querySelector '#apply'
rules = document.querySelector '#adj'

generateAdjacencyFunction = (syntax) ->
  record = []
  lines = syntax.split '\n'
  for line in lines
    record.push line.split(' ').map (str) -> Number str

  return (i, j) ->
    for mod in record
      [i + mod[0], j + mod[1]]

recreateBoard = ->
  markedSquares = []

  for row, i in board.board
    for cell, j in row when cell.blocked
      markedSquares.push [i, j]

  board = new Chessboard()

  for square in markedSquares
    board.board[square[0]][square[1]].blocked = true

applier.addEventListener 'click', (event) ->
  getAdjacency = generateAdjacencyFunction rules.value
  recreateBoard()

  reanimate()

showgraph = document.querySelector "#showgraph"
showgraph.addEventListener 'change', ->
  showGraph ^= true
  reanimate()
