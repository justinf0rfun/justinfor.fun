"use client";

import Device from "./react-bits/device";
import type { MotionState } from "../lib/mobile-gravity";
import "./MotionPermission.css";

interface Props {
  state: MotionState;
  ready: boolean;
  onRequest: () => void;
}

export default function MotionPermission({ state, ready, onRequest }: Props) {
  const needsSpace = state === "prompt" || state === "requesting";
  const visible = ready && needsSpace;
  const pending = state === "requesting";

  return (
    <div
      className={`motion-permission-row${ready ? " is-ready" : ""}${needsSpace ? "" : " is-collapsed"}`}
      data-motion-permission
    >
      <button
        type="button"
        className={`motion-permission-control${visible ? " is-visible" : ""}${pending ? " is-pending" : ""}`}
        data-motion-permission-button
        aria-label="Enable tilt and shake for these icons"
        aria-busy={pending}
        aria-hidden={!visible}
        disabled={!visible || pending}
        tabIndex={visible && !pending ? 0 : -1}
        onClick={onRequest}
      >
        <span className="motion-permission-fall" aria-hidden="true">
          <span className="motion-permission-toy">
            <Device
              width={25}
              finish="titanium"
              screenColor="#f3efe8"
              rotateX={6}
              rotateY={-12}
              interactive={false}
              drag={false}
              float={0}
              intro={false}
              paused
              reflection={0.6}
              shadow={0.25}
            >
              <span className="motion-permission-screen">
                <span className="motion-permission-ball motion-permission-ball-a" />
                <span className="motion-permission-ball motion-permission-ball-b" />
              </span>
            </Device>
          </span>
        </span>
      </button>
    </div>
  );
}
