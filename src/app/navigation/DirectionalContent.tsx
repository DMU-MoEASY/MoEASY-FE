import { useState, type ReactNode } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m as motion, useReducedMotion } from 'motion/react';

/** Only the changing body moves; navigation and tab controls stay mounted. */
export function DirectionalContent({screen, order, children, className = ''}: {screen:string;order:readonly string[];children:ReactNode;className?:string}) {
  const reduce = useReducedMotion();
  const [navigation,setNavigation] = useState({screen, direction:1});
  let current = navigation;
  if(navigation.screen !== screen) {
    const before = order.indexOf(navigation.screen), after = order.indexOf(screen);
    current = {screen,direction:before >= 0 && after >= 0 && after < before ? -1 : 1};
    setNavigation(current);
  }
  return <LazyMotion features={domAnimation}><div className="directional-viewport"><AnimatePresence initial={false} custom={current.direction} mode="popLayout">
    <motion.div key={screen} custom={current.direction} variants={{
      enter:(direction:number)=>({opacity:0,x:reduce?0:direction*28,scale:reduce?1:0.992}),
      visible:{opacity:1,x:0,scale:1},
      leave:(direction:number)=>({opacity:0,x:reduce?0:-direction*20,scale:reduce?1:0.992,pointerEvents:'none' as const}),
    }} initial="enter" animate="visible" exit="leave" transition={{duration:reduce?0:0.2,ease:[0.22,1,0.36,1]}} className={className}>{children}</motion.div>
  </AnimatePresence></div></LazyMotion>;
}

export function ScreenEntrance({children,direction}:{children:ReactNode;direction:number}) {
  const reduce = useReducedMotion() || !!document.documentElement.dataset.meetupTransition;
  return <LazyMotion features={domAnimation}><motion.div initial={{opacity:reduce?1:0.7,x:reduce?0:direction*24,scale:reduce?1:0.996}} animate={{opacity:1,x:0,scale:1}} transition={{duration:reduce?0:0.2,ease:[0.22,1,0.36,1]}}>{children}</motion.div></LazyMotion>;
}

export function useScreenDirection(screen:string,depth:number) {
  const [previous,setPrevious] = useState({screen,depth,direction:1});
  if(previous.screen!==screen) {
    const next={screen,depth,direction:depth<previous.depth?-1:1};
    setPrevious(next);
    return next.direction;
  }
  return previous.direction;
}
