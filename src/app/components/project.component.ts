import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

import {
  Badge,
  CommonEvent,
  ExtensionCategory,
  Graph,
  GraphEvent,
  iconfont,
  Label,
  Rect,
  register,
  treeToGraphData,
} from '@antv/g6';

@Component({
  standalone: true,
  selector: 'app-graph-FundFlowComponent',
  template: `<div #container style="width: 100%; height: 100%;"></div>`,
  styleUrls: ['./project.component.scss'],
})

export class ProjectComponent extends Rect implements AfterViewInit  {
  @ViewChild('container', { static: true }) containerRef!: ElementRef;

  private static COLORS = {
    B: '#1783FF',
    R: '#F46649',
    Y: '#DB9D0D',
    G: '#60C42D',
    DI: '#A7A7A7',
  };

  private static GREY_COLOR = '#CED4D9';

  constructor(private rect: Rect){
    super(rect);
  }
 

  ngAfterViewInit(): void {
    const style = document.createElement('style');
    style.innerHTML = `@import url('${iconfont.css}');`;
    document.head.appendChild(style);

    class TreeNode extends Rect {
      get data() {
        return this.context.model.getNodeLikeDatum(this.id);
      }
      get childrenData() {
        return this.context.model.getChildrenData(this.id);
      }
      override getLabelStyle(attributes: any) {
        const { type, depth, label } = this.data;
        return {
          text: label || '',
          fill: type === 'root'
            ? ProjectComponent.COLORS.B
            : type === 'leaf'
            ? ProjectComponent.COLORS.G
            : ProjectComponent.COLORS.DI,
          fontSize: 14,
          fontWeight: depth === 0 ? 'bold' : 'normal',
          textBaseline: 'middle' as const,
          textAlign: 'center' as const,
          ...attributes,
        };
      }

      drawPriceShape(cfg: any, group: any) {
        const { price, type } = this.data;
        if (typeof price !== 'number' || isNaN(price)) {
          return null;
        }

        return group.addShape('text', {
          attrs: {
            x: 100,
            y: 30,
            text: `R$ ${price.toFixed(2)}`,
            fill: type === 'root'
              ? ProjectComponent.COLORS.R
              : type === 'leaf'
              ? ProjectComponent.COLORS.Y
              : ProjectComponent.COLORS.B,
            fontSize: 12,
            textAlign: 'right' as const,
          },
          name: 'price-text',
        });
      }

      drawBadgeShape(cfg: any, group: any) {
        const { badge, type } = this.data;
        if (!badge) {
          return null;
        }

        return group.addShape('text', {
          attrs: {
            x: 10,
            y: 10,
            text: badge,
            fill: type === 'root'
              ? ProjectComponent.COLORS.Y
              : type === 'leaf'
              ? ProjectComponent.COLORS.B
              : ProjectComponent.COLORS.DI,
            fontSize: 10,
            fontWeight: 'bold',
            textAlign: 'left' as const,
          },
          name: 'badge-text',
        });
      }

      drawShape(cfg: any, group: any) {
        const rect = group.addShape('rect', {
          attrs: {
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            fill: '#ffffff',
            stroke: this.data.type === 'root' ? ProjectComponent.COLORS.B : ProjectComponent.GREY_COLOR,
            lineWidth: 2,
            radius: 4,
            shadowColor: 'rgba(0,0,0,0.1)',
            shadowBlur: 5
          },
          name: 'rect',
          state: {
            selected: {
              stroke: ProjectComponent.COLORS.R,
              lineWidth: 3
            },
            hover: {
              stroke: ProjectComponent.COLORS.G,
              shadowBlur: 10
            }
          }
        });
      
        return rect;
      }      
    }
         

    register(ExtensionCategory.NODE, 'tree-node', TreeNode);

    fetch('https://assets.antv.antgroup.com/g6/decision-tree.json')
      .then((res) => res.json())
      .then((data) => {
        const graph = new Graph({
          container: this.containerRef.nativeElement,
          data: treeToGraphData(data, {
            getNodeData: (datum, depth) => {
              if (Array.isArray(datum.children)) {
                const { children, ...restDatum } = datum;

                return {
                  ...restDatum,
                  children: children
                    .map((child) => {
                      if (child && child.id) {
                        return child.id;
                      }
                      console.warn('Filho inválido:', child);
                      return '';
                    })
                    .filter((id) => id !== ''),
                };
              }

              return {
                ...datum,
                children: [],
              };
            },
          }),
          node: {
            type: 'tree-node',
            style: {
              size: [202, 60],
              ports: [{ placement: 'left' }, { placement: 'right' }],
              radius: 4,
            },
          },
          edge: {
            type: 'cubic-horizontal',
            style: {
              stroke: ProjectComponent.GREY_COLOR,
            },
          },
          layout: {
            type: 'indented',
            direction: 'LR',
            dropCap: false,
            indent: 300,
            getHeight: () => 60,
          },
          behaviors: ['zoom-canvas', 'drag-canvas'],
        });

        graph.once(GraphEvent.AFTER_RENDER, () => {
          graph.fitView();
        });

        graph.render();
      });
  }
}
