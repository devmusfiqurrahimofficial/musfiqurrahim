import { NextResponse } from 'next/server'
import { commands, projects, settings, skills, toApi } from '@/lib/db'
import { handleApiError, sorted } from '@/lib/apiHelper'
import type { Profile } from '@/types/models'

const EMPTY_PROFILE: Profile = { name: '', bio: [], stats: [], socials: {} }

export async function GET() {
  try {
    const settingsColl = await settings()
    const [profileDoc, projectList, skillList, commandList, toolsDoc, metaDoc] = await Promise.all([
      settingsColl.findOne({ _id: 'profile' as any }),
      sorted(projects),
      sorted(skills),
      sorted(commands),
      settingsColl.findOne({ _id: 'tools' as any }),
      settingsColl.findOne({ _id: 'meta' as any }),
    ])

    const { _id: _pId, ...profileData } = (profileDoc as any) || {}
    const profile: Profile = { ...EMPTY_PROFILE, ...profileData }

    return NextResponse.json(
      {
        profile,
        projects: projectList.map(toApi),
        skills: skillList.map(toApi),
        commands: commandList.map(toApi),
        tools: (toolsDoc as any)?.tools ?? [],
        updatedAt: (metaDoc as any)?.updatedAt ?? null,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (err) {
    return handleApiError(err)
  }
}
