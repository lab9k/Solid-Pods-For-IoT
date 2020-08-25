/**
 * Object mapping of known possible inboxes for the user
 */
export const NavigationItems = [
  {
    id: 'welcome',
    icon: '/img/icon/apps.svg',
    label: 'navBar.welcome',
    to: '/welcome'
  },
  {
    id: 'profile',
    icon: '/img/people.svg',
    label: 'navBar.profile',
    to: '/profile'
  },
  {
    id: 'solid-iot',
    icon: '/img/icon/things.svg',
    label: 'navBar.solid-iot',
    to: '/iot-graph'
  },
  {
    id: 'text-editor',
    icon: '/img/icon/files.svg',
    label: 'navBar.text-editor',
    to: '/text-editor'
  }
];

export const ProfileOptions = [
  {
    label: 'navBar.profile',
    onClick: 'profileRedirect',
    icon: 'cog'
  },
  {
    label: 'navBar.formModelConvert',
    onClick: 'formModelConvertRedirect'
  },
  {
    label: 'navBar.formModelRender',
    onClick: 'formModelRenderRedirect'
  },
  {
    label: 'navBar.logOut',
    onClick: 'logOut',
    icon: 'lock'
  }
];
