import {useEffect} from 'react';
import type {RefObject} from 'react';
/** Measure actual responsive height, never guess a fixed desktop/mobile offset. */
export function useMeasuredHeader(ref:RefObject<HTMLElement|null>,variable:string){
 useEffect(()=>{const element=ref.current;if(!element)return;const update=()=>document.documentElement.style.setProperty(variable,`${Math.ceil(element.getBoundingClientRect().height)}px`);update();const observer=new ResizeObserver(update);observer.observe(element);window.addEventListener('resize',update);return()=>{observer.disconnect();window.removeEventListener('resize',update);document.documentElement.style.removeProperty(variable);};},[ref,variable]);
}
