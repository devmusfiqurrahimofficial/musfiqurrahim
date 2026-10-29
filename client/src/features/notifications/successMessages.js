// Keyed by endpoint name or thunk type. Plain strings, no imports, so this doesn't pull admin code
// into the visitor bundle. Functions get (arg, result); return null to skip the toast.
export const SUCCESS_MESSAGES = {
  saveProject: (body) => (body.id ? 'Project saved' : 'Project created'),
  deleteProject: 'Project deleted',
  reorderProjects: 'Order saved',
  saveSkillGroup: (body) => (body.id ? `${body.group} saved` : null),
  deleteSkillGroup: 'Group deleted',
  saveCommand: (body) => (body.id ? 'Command saved' : 'Command added'),
  deleteCommand: 'Command deleted',
  updateProfile: 'Profile saved',
  updateTools: 'Tools saved',
  deleteMessage: 'Message deleted',
  sendMail: (_, result) => `Email sent to ${result.to}`,
  'uploads/uploadImage': 'Image uploaded',
  'auth/sendPasswordReset': (email) => `Reset link sent to ${email}`,
  'auth/copyUid': 'UID copied',
}
