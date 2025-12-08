import React, { useRef, useEffect, useContext, createContext } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { CSSTransition as ReactCSSTransition } from 'react-transition-group';

interface TransitionContextValue {
  parent: {
    show?: boolean;
    isInitialRender?: boolean;
    appear?: boolean;
  };
}

const TransitionContext = createContext<TransitionContextValue>({
  parent: {},
});

function useIsInitialRender(): boolean {
  const isInitialRender = useRef(true);
  useEffect(() => {
    isInitialRender.current = false;
  }, []);
  // eslint-disable-next-line react-hooks/refs
  return isInitialRender.current;
}

type TransitionTagName = keyof HTMLElementTagNameMap;
type TransitionDomProps = HTMLAttributes<HTMLElement>;
type TransitionElementProps = TransitionDomProps & { ref: React.Ref<HTMLElement> };

interface CSSTransitionProps extends TransitionDomProps {
  show: boolean;
  enter?: string;
  enterStart?: string;
  enterEnd?: string;
  leave?: string;
  leaveStart?: string;
  leaveEnd?: string;
  appear?: boolean;
  unmountOnExit?: boolean;
  tag?: TransitionTagName;
  children: React.ReactNode;
}

function CSSTransition({
  show,
  enter = '',
  enterStart = '',
  enterEnd = '',
  leave = '',
  leaveStart = '',
  leaveEnd = '',
  appear,
  unmountOnExit,
  tag = 'div',
  children,
  style,
  ...rest
}: CSSTransitionProps) {
  const enterClasses = enter.split(' ').filter(Boolean);
  const enterStartClasses = enterStart.split(' ').filter(Boolean);
  const enterEndClasses = enterEnd.split(' ').filter(Boolean);
  const leaveClasses = leave.split(' ').filter(Boolean);
  const leaveStartClasses = leaveStart.split(' ').filter(Boolean);
  const leaveEndClasses = leaveEnd.split(' ').filter(Boolean);
  const removeFromDom = unmountOnExit;

  const nodeRef = useRef<HTMLElement>(null);

  const addClasses = (node: HTMLElement, classes: string[]) => {
    if (classes.length) {
      node.classList.add(...classes);
    }
  };

  const removeClasses = (node: HTMLElement, classes: string[]) => {
    if (classes.length) {
      node.classList.remove(...classes);
    }
  };

  const initialStyle: CSSProperties = {
    ...style,
    ...(removeFromDom ? {} : { display: style?.display ?? 'none' }),
  };

  return (
    <ReactCSSTransition
      appear={appear}
      nodeRef={nodeRef}
      unmountOnExit={removeFromDom}
      in={show}
      addEndListener={(done: () => void) => {
        nodeRef.current?.addEventListener('transitionend', done, false);
      }}
      onEnter={() => {
        if (nodeRef.current) {
          if (!removeFromDom) nodeRef.current.style.display = '';
          addClasses(nodeRef.current, [...enterClasses, ...enterStartClasses]);
        }
      }}
      onEntering={() => {
        if (nodeRef.current) {
          removeClasses(nodeRef.current, enterStartClasses);
          addClasses(nodeRef.current, enterEndClasses);
        }
      }}
      onEntered={() => {
        if (nodeRef.current) {
          removeClasses(nodeRef.current, [...enterEndClasses, ...enterClasses]);
        }
      }}
      onExit={() => {
        if (nodeRef.current) {
          addClasses(nodeRef.current, [...leaveClasses, ...leaveStartClasses]);
        }
      }}
      onExiting={() => {
        if (nodeRef.current) {
          removeClasses(nodeRef.current, leaveStartClasses);
          addClasses(nodeRef.current, leaveEndClasses);
        }
      }}
      onExited={() => {
        if (nodeRef.current) {
          removeClasses(nodeRef.current, [...leaveEndClasses, ...leaveClasses]);
          if (!removeFromDom) nodeRef.current.style.display = 'none';
        }
      }}
    >
      {React.createElement(
        tag,
        {
          ...rest,
          ref: nodeRef,
          style: initialStyle,
        } as TransitionElementProps,
        children,
      )}
    </ReactCSSTransition>
  );
}

interface TransitionProps extends Omit<CSSTransitionProps, 'show'> {
  show?: boolean;
}

function Transition({ show, appear, ...rest }: TransitionProps) {
  const { parent } = useContext(TransitionContext);
  const isInitialRender = useIsInitialRender();
  const isChild = show === undefined;

  if (isChild) {
    return (
      <CSSTransition
        appear={parent.appear || !parent.isInitialRender}
        show={parent.show ?? false}
        {...rest}
      />
    );
  }

  return (
    <TransitionContext.Provider
      value={{
        parent: {
          show,
          isInitialRender,
          appear,
        },
      }}
    >
      <CSSTransition appear={appear} show={show} {...rest} />
    </TransitionContext.Provider>
  );
}

export default Transition;