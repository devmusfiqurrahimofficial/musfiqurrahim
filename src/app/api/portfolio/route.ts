import { NextResponse } from 'next/server'
import { commands, projects, settings, skills, toApi } from '@/lib/db'
import { handleApiError, sorted } from '@/lib/apiHelper'
import { logger } from '@/lib/logger'
import {
  profile as defaultProfile,
  projects as defaultProjects,
  skills as defaultSkills,
  tools as defaultTools,
} from '@/data'
import type { Profile } from '@/types/models'

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
    const profile: Profile = profileDoc ? { ...defaultProfile, ...profileData } : defaultProfile

    return NextResponse.json(
      {
        profile,
        projects: projectList.map(toApi),
        skills: skillList.map(toApi),
        commands: commandList.map(toApi),
        tools: (toolsDoc as any)?.tools ?? defaultTools,
        updatedAt: (metaDoc as any)?.updatedAt ?? null,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (err) {
    logger.warn({ err }, '[api/portfolio] Database unavailable, serving bundled default data')
    return NextResponse.json(
      {
        profile: defaultProfile,
        projects: defaultProjects,
        skills: defaultSkills,
        commands: [],
        tools: defaultTools,
        updatedAt: null,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  }
}
