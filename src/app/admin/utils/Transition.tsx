import React, { useRef, useEffect, useContext, createContext } from 'react';
import { CSSTransition as ReactCSSTransition } from 'react-transition-group';

interface TransitionContextProps {
  parent: {
    show?: boolean;
    isInitialRender?: boolean;
    appear?: boolean;
  };
}

const TransitionContext = createContext<TransitionContextProps>({
  parent: {},
});

function useIsInitialRender() {
  const isInitialRender = useRef(true);
  useEffect(() => {
    isInitialRender.current = false;
  }, []);
  return isInitialRender.current;
}

interface CSSTransitionProps {
  show: boolean;
  enter?: string;
  enterStart?: string;
  enterEnd?: string;
  leave?: string;
  leaveStart?: string;
  leaveEnd?: string;
  appear?: boolean;
  unmountOnExit?: boolean;
  tag?: keyof HTMLElementTagNameMap;
  children: React.ReactNode;
  [key: string]: any; // Allow any other props
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
  ...rest
}: CSSTransitionProps) {
  const enterClasses = enter.split(' ').filter((s) => s.length);
  const enterStartClasses = enterStart.split(' ').filter((s) => s.length);
  const enterEndClasses = enterEnd.split(' ').filter((s) => s.length);
  const leaveClasses = leave.split(' ').filter((s) => s.length);
  const leaveStartClasses = leaveStart.split(' ').filter((s) => s.length);
  const leaveEndClasses = leaveEnd.split(' ').filter((s) => s.length);
  const removeFromDom = unmountOnExit;

  function addClasses(node: HTMLElement, classes: string[]) {
    classes.length && node.classList.add(...classes);
  }

  function removeClasses(node: HTMLElement, classes: string[]) {
    classes.length && node.classList.remove(...classes);
  }

  const nodeRef = useRef<HTMLElement>(null);

  const Component = tag;

  const ForwardedComponent = React.forwardRef<HTMLElement, any>((props, ref) => (
    <Component ref={ref} {...props} />
  ));
  ForwardedComponent.displayName = 'ForwardedComponent';

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
      <ForwardedComponent ref={nodeRef} {...rest} style={{ display: !removeFromDom ? 'none' : undefined }}>{children}</ForwardedComponent>
    </ReactCSSTransition>
  );
}

interface TransitionProps {
  show?: boolean;
  appear?: boolean;
  [key: string]: any; // Allow any other props
}

function Transition({ show, appear, ...rest }: TransitionProps) {
  const { parent } = useContext(TransitionContext);
  const isInitialRender = useIsInitialRender();
  const isChild = show === undefined;

  if (isChild) {
    return (
      <CSSTransition
        appear={parent.appear || !parent.isInitialRender}
        show={parent.show!}
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
      <CSSTransition appear={appear} show={show!} {...rest} />
    </TransitionContext.Provider>
  );
}

export default Transition;
