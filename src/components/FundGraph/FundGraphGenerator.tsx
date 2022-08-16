import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { FundNodeInterface, GraphElements, GroupRootNodeInterface } from '../../App.interface';
import { D3DragEvent, SimulationLinkDatum } from 'd3';

type CardSVG = d3.Selection<SVGSVGElement, FundNodeInterface, d3.BaseType, unknown>;

type Simulation = d3.Simulation<FundNodeInterface, SimulationLinkDatum<FundNodeInterface>>;

type DragEvent = D3DragEvent<SVGCircleElement, FundNodeInterface, FundNodeInterface>;

const generateCard = (cardElement: CardSVG) => {
  const cardGroup = cardElement.append('g');

  // Card Background
  cardGroup
    .append('rect')
    .classed('fund-label-card', true)
    .attr('fill', (d) => (d.type === 'FUND' ? '#18295e' : '#85054d'))
    .attr('width', width)
    .attr('height', height)
    .attr('rx', 20);

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

const width = 280;
const height = 120;

export const FundGraphGenerator: React.FC<FundGraphGeneratorProps> = ({ graphElements }) => {
  console.log('graphElements', JSON.stringify(graphElements));

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

        function dragged(event: D3DragEvent<SVGCircleElement, FundNodeInterface, FundNodeInterface>) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }

        function dragEnded(event: D3DragEvent<SVGCircleElement, FundNodeInterface, FundNodeInterface>) {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }

        return d3.drag<SVGCircleElement, FundNodeInterface>().on('start', dragStarted).on('drag', dragged).on('end', dragEnded);
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
        .force('collide', d3.forceCollide(150))
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
            const cardSVG = enter.append('svg').attr('width', width).attr('height', height);
            generateCard(cardSVG);
            return cardSVG;
          },
          (update) => {
            // Redraw the card
            update.html('');
            generateCard(update as unknown as CardSVG);
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

        node.attr('x', (d) => (d.x ? (d.x as number) - width / 2 : 0)).attr('y', (d) => (d.y ? (d.y as number) - height / 2 : 0));
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
