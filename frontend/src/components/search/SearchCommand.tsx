"use client";

import React from "react";
import { GlobalSearch } from "./GlobalSearch";

interface SearchCommandProps {
  className?: string;
  placeholder?: string;
}

export function SearchCommand({
  className = "",
  placeholder = "Command palette / search (Ctrl+K)...",
}: SearchCommandProps) {
  return <GlobalSearch className={className} placeholder={placeholder} />;
}
