SQUARE_WIDTH = 50
ANIMATION_TICK = 100

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
  for i in [0...8]
    for j in [0...8]
      if board.board[i][j].blocked
        ctx.fillStyle = '#f00'
      else if visited[board.board[i][j].id]
        ctx.fillStyle = if ((i + j) % 2) is 0 then '#335' else '#AAD'
      else
        ctx.fillStyle = if ((i + j) % 2) is 0 then '#000' else '#DDD'
      ctx.fillRect i * SQUARE_WIDTH, j * SQUARE_WIDTH, SQUARE_WIDTH, SQUARE_WIDTH

redrawBoard()

drawPath_raw = (path) ->

  unless path? then return

  ctx.beginPath()
  ctx.strokeStyle = '#f00'
  ctx.lineWidth = 2

  for coord, i in path
    if i is 0
      ctx.moveTo (coord[0] + 0.5) * SQUARE_WIDTH, (coord[1] + 0.5) * SQUARE_WIDTH
    else
      ctx.lineTo (coord[0] + 0.5) * SQUARE_WIDTH, (coord[1] + 0.5) * SQUARE_WIDTH

  ctx.stroke()

drawPath = (path) ->
  redrawBoard()

  drawPath_raw path

drawAnimation = (first, last, paths, visited) ->
  redrawBoard visited
  for path in paths
    drawPath_raw path.toArray().map (node) -> node.data

canvas.addEventListener 'click', (event) ->
  if globalAnimationTimeout?
    clearTimeout globalAnimationTimeout
  redrawBoard()

  [x, y] = [Math.floor(event.offsetX / SQUARE_WIDTH), Math.floor(event.offsetY / SQUARE_WIDTH)]

  board.board[x][y].blocked ^= true
  board.animateShortestPath(board.board[0][0], board.board[7][7], ((path) ->
    drawPath path?.map (node) -> node.data
  ))
