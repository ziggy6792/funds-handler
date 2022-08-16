import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { FundNodeInterface, GraphElements, GroupRootNodeInterface } from '../../App.interface';
import { D3DragEvent } from 'd3';

type CardSVG = d3.Selection<d3.BaseType, FundNodeInterface, d3.BaseType, unknown>;

type Simulation = d3.Simulation<FundNodeInterface, undefined>;

type DragEvent = D3DragEvent<SVGCircleElement, FundNodeInterface, FundNodeInterface>;

const generateCard = (cardElement: CardSVG) => {
  const cardGroup = cardElement.append('g');

  // Card Background
  cardGroup
    .append('rect')
    .classed('fund-label-card', true)
    .attr('fill', (d) => (d.type === 'FUND' ? '#18295e' : '#85054d'))
    .attr('width', '180px')
    .attr('height', '120px')
    .attr('rx', '20px');

  // Card Contents
  const textOffset = 20;
  const initialOffset = 25;

  cardGroup
    .append('text')
    .attr('font-weight', 'bold')
    .attr('transform', 'translate(20, ' + initialOffset + ')')
    .text((d) => (d.type === 'FUND' ? d!.fund!.name : (d as GroupRootNodeInterface)!.groupRootText));
  cardGroup
    .append('text')
    .attr('transform', 'translate(20, ' + (textOffset + initialOffset) + ')')
    .text((d) => (d.type === 'FUND' ? d!.fund!.manager : (d as GroupRootNodeInterface)!.groupRootAttribute));
  cardGroup
    .append('text')
    .attr('transform', 'translate(20, ' + (textOffset * 2 + initialOffset) + ')')
    .text((d) => (d.type === 'FUND' ? d?.fund?.year || null : ''));
  cardGroup
    .append('text')
    .attr('transform', 'translate(20, ' + (textOffset * 3 + initialOffset) + ')')
    .text((d) => (d.type === 'FUND' ? d?.fund?.type || null : ''));
  cardGroup
    .append('text')
    .attr('transform', 'translate(20, ' + (textOffset * 4 + initialOffset) + ')')
    .text((d) => {
      if (d.type === 'FUND') return d?.fund?.isOpen ? 'Open' : 'Closed';
      return '';
    });

  cardGroup.selectAll('text').style('fill', 'white');
};

interface FundGraphGeneratorProps {
  graphElements: GraphElements;
}

export const FundGraphGenerator: React.FC<FundGraphGeneratorProps> = ({ graphElements }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const updateGraph = async () => {
      const links = graphElements.links.map((d) => Object.assign({}, d));
      const nodes = graphElements.nodes.map((d) => Object.assign({}, d));
      const drag = (simulation: Simulation) => {
        function dragStarted(event: DragEvent) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }

        function dragged(event: DragEvent) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }

        function dragEnded(event: DragEvent) {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }

        return d3.drag().on('start', dragStarted).on('drag', dragged).on('end', dragEnded);
      };

      const simulation = d3
        .forceSimulation(nodes)
        .force(
          'link',
          d3
            .forceLink(links)
            .id((d: any) => d.id)
            .distance(240)
        )
        .force('charge', d3.forceManyBody().strength(-240))
        .force('center', d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2));

      const svg = d3.select(svgRef.current);

      const link = svg
        .select('#graph-links')
        .attr('stroke', '#FFF')
        .attr('stroke-opacity', 0.6)
        .selectAll('line')
        .data(links)
        .join(
          (enter) => enter.append('line'),
          (update) => update,
          (exit) => exit.remove()
        )
        .attr('stroke-width', (d: any) => Math.sqrt(d.value));

      const node = svg
        .select('#graph-nodes')
        .selectAll('svg')
        .data(nodes)
        .join(
          (enter) => {
            const cardSVG = enter.append('svg').attr('width', '180px').attr('height', '120px') as unknown as CardSVG;
            generateCard(cardSVG);
            return cardSVG;
          },
          (update: CardSVG) => {
            // Redraw the card
            update.html('');
            generateCard(update);
            return update;
          },
          (exit) => exit.remove()
        )
        .call(drag(simulation) as any);

      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node.attr('x', (d: any) => d.x - 90).attr('y', (d: any) => d.y - 60);
      });
    };
    updateGraph();
  }, [graphElements]);

  return (
    <svg ref={svgRef} width='100%' id='graph-svg'>
      <g id='graph-links' stroke='#999' strokeOpacity='0.6'></g>
      <g id='graph-nodes'></g>
      <g id='graph-labels'></g>
    </svg>
  );
};
