import { MultiBackend, TouchTransition, MouseTransition } from 'dnd-multi-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

export const multiBackendOptions = {
  backends: [
    {
      id: 'html5',
      backend: HTML5Backend,
      transition: MouseTransition
    },
    {
      id: 'touch',
      backend: TouchBackend,
      options: {
        enableMouseEvents: true,
        enableKeyboardEvents: true,
        delayTouchStart: 50,
        ignoreContextMenu: true
      },
      preview: true,
      transition: TouchTransition
    }
  ]
};

export default MultiBackend;

