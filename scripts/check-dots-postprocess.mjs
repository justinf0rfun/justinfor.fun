import * as THREE from 'three';
import {createDotsPostprocess} from '../src/lib/dots/postprocess.js';
import assert from 'node:assert/strict';
let current=null,targets=0;
const source={extensions:{has:()=>true},capabilities:{maxSamples:4},getContext:()=>({getContextAttributes:()=>({premultipliedAlpha:true})}),getDrawingBufferSize:v=>v.set(164,328),getSize:v=>v.set(164,328),getPixelRatio:()=>1,xr:{enabled:false},autoClear:true,autoClearDepth:true,setRenderTarget(t){if(t){assert.ok(t.texture.isTexture,'r187 requires a scalar first attachment');assert.ok(Array.isArray(t.texture.mipmaps));assert.ok(t.textures.every(texture=>typeof texture.format==='number'));targets++;}current=t;},getRenderTarget:()=>current,render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld();},getClearColor:c=>c.set(0),getClearAlpha:()=>0,setClearColor(){},setClearAlpha(){},clear(){}};
const renderer=new Proxy(source,{get(target,key){if(!(key in target))throw Error('Missing renderer member '+String(key));return target[key]}});
const pass=createDotsPostprocess(renderer,new THREE.Scene(),new THREE.OrthographicCamera(-1,1,2,-2,.1,100));
pass.render();pass.dispose();assert.ok(targets>4);console.log('AO render target compatibility passed',targets);
