"use client"

import { signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ProfileProps = {
  username: string
}

export default function Profile({ username }: ProfileProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 items-center rounded-lg border border-cyan-400/45 bg-black/65 px-3 text-xs uppercase tracking-wide text-cyan-100 transition-colors hover:bg-black/80 hover:text-cyan-50">
        {username}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-44 border border-cyan-400/45 bg-black text-cyan-100 ring-cyan-500/25"
        align="end"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-cyan-200/80">Signed in as</DropdownMenuLabel>
          <DropdownMenuItem className="cursor-default text-cyan-100 focus:bg-cyan-900/35 focus:text-cyan-100">
            {username}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="focus:bg-cyan-900/45 focus:text-cyan-100"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
