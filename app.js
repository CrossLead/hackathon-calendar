// Combo of http://bl.ocks.org/fancellu/2c782394602a93921faff74e594d1bb1
// and http://bl.ocks.org/rkirsling/5001347

var
  width = 600,
  height = 600,
  svg = d3.select('body').append('svg:svg')
    .attr('viewBox', '0 0 ' + width + ' ' + height)
    .attr('preserveAspectRatio', 'xMidYMid meet'),
  tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0),
  nodeRadius = 25,
  node,
  link;

svg.append('defs').append('marker')
  .attrs({
    'id': 'arrowhead',
    'viewBox': '-0 -5 10 10',
    'refX': nodeRadius,
    'refY': 0,
    'orient': 'auto',
    'markerWidth': 15,
    'markerHeight': 15,
    'xoverflow': 'visible'
  })
  .append('svg:path')
  .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
  .attr('fill', '#000')
  .style('stroke', 'none');

var simulation = d3.forceSimulation()
  .force('link', d3.forceLink().id(function (d) { return d.id; }).distance(200).strength(1))
  .force('charge', d3.forceManyBody().strength(-3000))
  .force('center', d3.forceCenter(width / 2, height / 2))
// .force('x', d3.forceX())
// .force('y', d3.forceY());

d3.json('data.json', function (error, graph) {
  if (error) throw error;
  update(graph.links, graph.nodes);
})

function update(links, nodes) {
  link = svg.selectAll('.link')
    .data(links)
    .enter()
    .append('line')
    .attr('class', 'link')
    .attr('marker-end', 'url(#arrowhead)')

  link.append('title')
    .text(function (d) { return d.type; });

  edgepaths = svg.selectAll('.edgepath')
    .data(links)
    .enter()
    .append('path')
    .attrs({
      'class': 'edgepath',
      'fill-opacity': 0,
      'stroke-opacity': 0,
      'id': function (d, i) { return 'edgepath' + i }
    })
    .style('pointer-events', 'none');

  edgelabels = svg.selectAll('.edgelabel')
    .data(links)
    .enter()
    .append('text')
    .style('pointer-events', 'none')
    .attrs({
      'class': 'edgelabel',
      'id': function (d, i) { return 'edgelabel' + i },
      'font-size': 10,
      'fill': '#aaa'
    });

  edgelabels.append('textPath')
    .attr('xlink:href', function (d, i) { return '#edgepath' + i })
    .style('text-anchor', 'middle')
    .style('pointer-events', 'none')
    .attr('startOffset', '50%')
    .text(function (d) { return d.type });

  node = svg.selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
    //.on('end', dragended)
    );


  var max = d3.max(nodes, function (d) { return d.hours });
  var colorScale = d3.scaleLinear()
    .domain([0, max / .75])
    .range([0, 1]);

  var rg = node.append('radialGradient')
    .attr('id', function (d) { return 'mcglow' + d.id })
    .attr('class', 'mcglow');

  rg.append('stop')
    .attr('class', 'color')
    .attr('offset', '50%')
    .attr('stop-color', function(d) { return d3.interpolateOranges(colorScale(d.hours || 0)) });

  rg.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#888')
    .attr('stop-opacity', 0);

  // sel.select('.ring').attr('style', 'fill:url(#mcglow' + d.id + ')');
  node.append('circle')
    .attr('r', nodeRadius + 20)
    .attr('style', function(d) { return 'fill:url(#mcglow'+ d.id + ')' });

  node.append('circle')
    .attr('r', nodeRadius)
    .style('fill', function (d, i) {
      return d3.interpolateOranges(colorScale(d.hours || 0));
    });
  // .on('mouseover', function (d) {
  //   tooltip.transition()
  //     .duration(200)
  //     .style('opacity', .9);
  //   tooltip.html('Hours spent monthly: ' + d.hours)
  //     .style('left', (d3.event.pageX) + 'px')
  //     .style('top', (d3.event.pageY - 28) + 'px');
  // })
  // .on('mouseout', function (d) {
  //   tooltip.transition()
  //     .duration(500)
  //     .style('opacity', 0);
  // });

  // node.append('title')
  //   .text(function (d) { return d.id; });

  node.append('text')
    .attr('dy', nodeRadius * -1 - 5)
    .attr('text-anchor', 'middle')
    .text(function (d) { return d.name; })
    .attr('class', 'node-title');

  node.append('text')
    .attr('dy', nodeRadius + 15)
    .attr('text-anchor', 'middle')
    .text(function (d) { return d.label; })
    .attr('class', 'node-label');

  node.append('text')
    .attr('dy', nodeRadius / 4)
    .attr('text-anchor', 'middle')
    .text(function (d) { return d.hours + 'hrs'; })
    .attr('class', 'node-hours');

  simulation
    .nodes(nodes)
    .on('tick', ticked);

  simulation.force('link')
    .links(links);
}

function ticked() {
  link
    .attr('x1', function (d) { return d.source.x; })
    .attr('y1', function (d) { return d.source.y; })
    .attr('x2', function (d) { return d.target.x; })
    .attr('y2', function (d) { return d.target.y; });

  node
    .attr('transform', function (d) { return 'translate(' + d.x + ', ' + d.y + ')'; });

  edgepaths.attr('d', function (d) {
    return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
  });

  edgelabels.attr('transform', function (d) {
    if (d.target.x < d.source.x) {
      var bbox = this.getBBox();

      rx = bbox.x + bbox.width / 2;
      ry = bbox.y + bbox.height / 2;
      return 'rotate(180 ' + rx + ' ' + ry + ')';
    }
    else {
      return 'rotate(0)';
    }
  });
}

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart()
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

//    function dragended(d) {
//        if (!d3.event.active) simulation.alphaTarget(0);
//        d.fx = undefined;
//        d.fy = undefined;
//    }
