(function() {
  var ANIMATION_TICK, Chessboard, Graph, Node, Path, SQUARE_WIDTH, applier, board, canvas, ctx, customer, drawAnimation, drawPath, drawPath_raw, fps, generateAdjacencyFunction, getAdjacency, globalAnimationTimeout, reanimate, recreateBoard, redrawBoard, rules, selector, showGraph, showgraph, _node_id,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SQUARE_WIDTH = 50;

  ANIMATION_TICK = 100;

  showGraph = true;

  globalAnimationTimeout = null;

  Path = (function() {
    function Path(data, prev) {
      this.data = data;
      this.prev = prev;
    }

    Path.prototype.toArray = function() {
      var array, head;
      array = [];
      head = this;
      while (head !== null) {
        array.unshift(head.data);
        head = head.prev;
      }
      return array;
    };

    return Path;

  })();

  Graph = (function() {
    function Graph(nodes) {
      this.nodes = nodes != null ? nodes : [];
    }

    Graph.prototype.findShortestPath = function(first, last) {
      var ex, node, paths, visited, _i, _len, _ref;
      visited = {};
      paths = [new Path(first, null)];
      while (true) {
        ex = paths.shift();
        _ref = ex.data.nodes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          if (!(!visited[node.id] && !node.blocked)) {
            continue;
          }
          visited[node.id] = true;
          if (node === last) {
            return (new Path(last, ex)).toArray();
          } else {
            paths.push(new Path(node, ex));
          }
        }
        if (paths.length === 0) {
          break;
        }
      }
      return null;
    };

    Graph.prototype.animateShortestPath = function(first, last, callback, paths, visited) {
      var ex, node, _i, _len, _ref;
      if (callback == null) {
        callback = (function() {});
      }
      if (paths == null) {
        paths = [new Path(first, null)];
      }
      if (visited == null) {
        visited = {};
      }
      ex = paths.shift();
      _ref = ex.data.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        if (!(!visited[node.id] && !node.blocked)) {
          continue;
        }
        visited[node.id] = true;
        if (node === last) {
          callback((new Path(last, ex)).toArray());
          return;
        } else {
          paths.push(new Path(node, ex));
        }
      }
      drawAnimation(first, last, paths, visited);
      if (paths.length === 0) {
        return callback(null);
      } else {
        return globalAnimationTimeout = setTimeout(((function(_this) {
          return function() {
            return _this.animateShortestPath(first, last, callback, paths, visited);
          };
        })(this)), ANIMATION_TICK);
      }
    };

    return Graph;

  })();

  _node_id = 0;

  Node = (function() {
    function Node(data, nodes) {
      this.data = data;
      this.nodes = nodes;
      this.id = _node_id++;
    }

    return Node;

  })();

  getAdjacency = function(i, j) {
    return [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1], [i + 1, j + 1], [i - 1, j - 1], [i + 1, j - 1], [i - 1, j + 1]];
  };

  Chessboard = (function(_super) {
    __extends(Chessboard, _super);

    function Chessboard() {
      var cell, coord, i, j, row, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3;
      Chessboard.__super__.constructor.apply(this, arguments);
      this.board = (function() {
        var _i, _results;
        _results = [];
        for (i = _i = 0; _i < 8; i = ++_i) {
          _results.push((function() {
            var _j, _results1;
            _results1 = [];
            for (j = _j = 0; _j < 8; j = ++_j) {
              _results1.push(new Node([i, j], []));
            }
            return _results1;
          })());
        }
        return _results;
      })();
      _ref = this.board;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        row = _ref[i];
        for (j = _j = 0, _len1 = row.length; _j < _len1; j = ++_j) {
          cell = row[j];
          _ref1 = getAdjacency(i, j);
          for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
            coord = _ref1[_k];
            if (((_ref2 = this.board[coord[0]]) != null ? _ref2[coord[1]] : void 0) != null) {
              cell.nodes.push(this.board[coord[0]][coord[1]]);
            }
          }
        }
      }
      _ref3 = this.board;
      for (i = _l = 0, _len3 = _ref3.length; _l < _len3; i = ++_l) {
        row = _ref3[i];
        for (j = _m = 0, _len4 = row.length; _m < _len4; j = ++_m) {
          cell = row[j];
          this.nodes.push(cell);
        }
      }
    }

    return Chessboard;

  })(Graph);

  board = new Chessboard();

  canvas = document.querySelector('canvas');

  ctx = canvas.getContext('2d');

  canvas.width = canvas.height = 8 * SQUARE_WIDTH;

  redrawBoard = function(visited) {
    var i, j, node, _i, _j, _k, _l, _len, _m, _ref;
    if (visited == null) {
      visited = {};
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (i = _i = 0; _i < 8; i = ++_i) {
      for (j = _j = 0; _j < 8; j = ++_j) {
        if (board.board[i][j].blocked) {
          ctx.fillStyle = '#f00';
        } else if (visited[board.board[i][j].id]) {
          ctx.fillStyle = ((i + j) % 2) === 0 ? '#553' : '#DDA';
        } else {
          ctx.fillStyle = ((i + j) % 2) === 0 ? '#888' : '#DDD';
        }
        ctx.fillRect(i * SQUARE_WIDTH, j * SQUARE_WIDTH, SQUARE_WIDTH, SQUARE_WIDTH);
      }
    }
    if (showGraph) {
      ctx.strokeStyle = '#00f';
      ctx.globalAlpha = 0.1;
      for (i = _k = 0; _k < 8; i = ++_k) {
        for (j = _l = 0; _l < 8; j = ++_l) {
          if (!board.board[i][j].blocked) {
            _ref = board.board[i][j].nodes;
            for (_m = 0, _len = _ref.length; _m < _len; _m++) {
              node = _ref[_m];
              if (!(!node.blocked)) {
                continue;
              }
              ctx.beginPath();
              ctx.moveTo((i + 0.5) * SQUARE_WIDTH, (j + 0.5) * SQUARE_WIDTH);
              ctx.lineTo((node.data[0] + 0.5) * SQUARE_WIDTH, (node.data[1] + 0.5) * SQUARE_WIDTH);
              ctx.stroke();
            }
          }
        }
      }
      return ctx.globalAlpha = 1;
    }
  };

  redrawBoard();

  drawPath_raw = function(path) {
    var coord, i, _i, _len;
    if (path == null) {
      return;
    }
    ctx.beginPath();
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#f00';
    for (i = _i = 0, _len = path.length; _i < _len; i = ++_i) {
      coord = path[i];
      if (i === 0) {
        ctx.moveTo((coord[0] + 0.5) * SQUARE_WIDTH, (coord[1] + 0.5) * SQUARE_WIDTH);
      } else {
        ctx.lineTo((coord[0] + 0.5) * SQUARE_WIDTH, (coord[1] + 0.5) * SQUARE_WIDTH);
      }
      ctx.fillRect((coord[0] + 0.45) * SQUARE_WIDTH, (coord[1] + 0.45) * SQUARE_WIDTH, SQUARE_WIDTH * 0.1, SQUARE_WIDTH * 0.1);
    }
    return ctx.stroke();
  };

  drawPath = function(path) {
    redrawBoard();
    return drawPath_raw(path);
  };

  drawAnimation = function(first, last, paths, visited) {
    var path, _i, _len, _results;
    redrawBoard(visited);
    _results = [];
    for (_i = 0, _len = paths.length; _i < _len; _i++) {
      path = paths[_i];
      _results.push(drawPath_raw(path.toArray().map(function(node) {
        return node.data;
      })));
    }
    return _results;
  };

  reanimate = function() {
    if (globalAnimationTimeout != null) {
      clearTimeout(globalAnimationTimeout);
    }
    return board.animateShortestPath(board.board[0][0], board.board[7][7], (function(path) {
      return drawPath(path != null ? path.map(function(node) {
        return node.data;
      }) : void 0);
    }));
  };

  canvas.addEventListener('click', function(event) {
    var x, y, _ref;
    redrawBoard();
    _ref = [Math.floor(event.offsetX / SQUARE_WIDTH), Math.floor(event.offsetY / SQUARE_WIDTH)], x = _ref[0], y = _ref[1];
    board.board[x][y].blocked ^= true;
    return reanimate();
  });

  fps = document.querySelector('#speed');

  fps.addEventListener('input', function(event) {
    return ANIMATION_TICK = 1000 / Number(this.value);
  });

  selector = document.querySelector('#presets');

  customer = document.querySelector('#custom-rule');

  selector.addEventListener('change', function(event) {
    customer.style.display = 'none';
    switch (this.value) {
      case 'king':
        getAdjacency = function(i, j) {
          return [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1], [i + 1, j + 1], [i - 1, j - 1], [i + 1, j - 1], [i - 1, j + 1]];
        };
        break;
      case 'knight':
        getAdjacency = function(i, j) {
          return [[i + 1, j + 2], [i - 1, j + 2], [i + 2, j + 1], [i + 2, j - 1], [i + 1, j - 2], [i - 1, j - 2], [i - 2, j - 1], [i - 2, j + 1]];
        };
        break;
      case 'custom':
        customer.style.display = 'block';
    }
    recreateBoard();
    return reanimate();
  });

  applier = document.querySelector('#apply');

  rules = document.querySelector('#adj');

  generateAdjacencyFunction = function(syntax) {
    var line, lines, record, _i, _len;
    record = [];
    lines = syntax.split('\n');
    for (_i = 0, _len = lines.length; _i < _len; _i++) {
      line = lines[_i];
      record.push(line.split(' ').map(function(str) {
        return Number(str);
      }));
    }
    return function(i, j) {
      var mod, _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = record.length; _j < _len1; _j++) {
        mod = record[_j];
        _results.push([i + mod[0], j + mod[1]]);
      }
      return _results;
    };
  };

  recreateBoard = function() {
    var cell, i, j, markedSquares, row, square, _i, _j, _k, _len, _len1, _len2, _ref, _results;
    markedSquares = [];
    _ref = board.board;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      row = _ref[i];
      for (j = _j = 0, _len1 = row.length; _j < _len1; j = ++_j) {
        cell = row[j];
        if (cell.blocked) {
          markedSquares.push([i, j]);
        }
      }
    }
    board = new Chessboard();
    _results = [];
    for (_k = 0, _len2 = markedSquares.length; _k < _len2; _k++) {
      square = markedSquares[_k];
      _results.push(board.board[square[0]][square[1]].blocked = true);
    }
    return _results;
  };

  applier.addEventListener('click', function(event) {
    getAdjacency = generateAdjacencyFunction(rules.value);
    recreateBoard();
    return reanimate();
  });

  showgraph = document.querySelector("#showgraph");

  showgraph.addEventListener('change', function() {
    showGraph ^= true;
    return reanimate();
  });

}).call(this);

//# sourceMappingURL=index.js.map
