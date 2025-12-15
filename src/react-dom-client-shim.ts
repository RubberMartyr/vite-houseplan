import React from 'react';
import ReactDOM from 'react-dom';

interface Root {
  render(children: React.ReactNode): void;
  unmount(): void;
}

export function createRoot(container: Element | DocumentFragment): Root {
  return {
    render(children) {
      ReactDOM.render(children as React.ReactElement, container);
    },
    unmount() {
      ReactDOM.unmountComponentAtNode(container as Element);
    },
  };
}
