import { MagitRepository } from '../models/magitRepository';
import { MenuUtil, MenuState } from '../menu/menu';
import { gitRun } from '../utils/gitRawRunner';
import { window, workspace } from 'vscode';
import { fetchSubmodules } from './fetchingCommands';
import SubmoduleListView from '../views/submoduleListView';
import { views } from '../extension';

const submodulesMenu = {
  title: 'Submodules',
  commands: [
    { label: 'a', description: 'Add', action: add },
    { label: 'r', description: 'Register', action: init },
    { label: 'p', description: 'Populate', action: populate },
    { label: 'u', description: 'Update', action: update },
    { label: 's', description: 'Synchronize', action: sync },
    { label: 'd', description: 'Unpopulate', action: unpopulate },
    { label: 'k', description: 'Remove', action: remove },
    { label: 'l', description: 'List all modules', action: listAll },
    { label: 'f', description: 'Fetch all modules', action: fetchAll },
  ]
};

export async function submodules(repository: MagitRepository) {

  const switches = [
    { shortName: '-f', longName: '--force', description: 'Force' },
    { shortName: '-r', longName: '--recursive', description: 'Recursive' },
    { shortName: '-N', longName: '--no-fetch', description: 'Do not fetch' },
    { shortName: '-C', longName: '--checkout', description: 'Checkout tip' },
    { shortName: '-R', longName: '--rebase', description: 'Rebase onto tip' },
    { shortName: '-M', longName: '--merge', description: 'Merge tip' },
    { shortName: '-U', longName: '--remote', description: 'Use upstream tip' }
  ];

  return MenuUtil.showMenu(submodulesMenu, { repository, switches });
}

async function add({ repository, switches }: MenuState) {

  const submoduleRemote = await window.showInputBox({ prompt: `Add submodule (remote url)` });

  if (submoduleRemote) {

    const args = ['submodule', 'add', ...MenuUtil.switchesToArgs(switches), submoduleRemote];
    return await gitRun(repository, args);
  }
}

async function init({ repository, switches }: MenuState) {

  const submodule = await pickSubmodule(repository, 'Populate module');

  if (submodule) {
    const args = ['submodule', 'init', ...MenuUtil.switchesToArgs(switches), '--', submodule];
    return await gitRun(repository, args);
  }
}

async function populate({ repository, switches }: MenuState) {

  const submodule = await pickSubmodule(repository, 'Populate module');

  if (submodule) {
    const args = ['submodule', 'update', '--init', ...MenuUtil.switchesToArgs(switches), '--', submodule];
    return await gitRun(repository, args);
  }
}

async function update({ repository, switches }: MenuState) {

  const submodule = await pickSubmodule(repository, 'Update module');

  if (submodule) {
    const args = ['submodule', 'update', ...MenuUtil.switchesToArgs(switches), '--', submodule];
    return await gitRun(repository, args);
  }
}

async function sync({ repository, switches }: MenuState) {

  const submodule = await pickSubmodule(repository, 'Synchronize module');

  if (submodule) {
    const args = ['submodule', 'sync', ...MenuUtil.switchesToArgs(switches), '--', submodule];
    return await gitRun(repository, args);
  }
}

async function unpopulate({ repository, switches }: MenuState) {

  const submodule = await pickSubmodule(repository, 'Unpopulate module');

  if (submodule) {
    const args = ['submodule', 'deinit', ...MenuUtil.switchesToArgs(switches), '--', submodule];
    return await gitRun(repository, args);
  }
}

async function remove({ repository, switches }: MenuState) {

  const submodule = await pickSubmodule(repository, 'Remove module');

  if (submodule) {

    const absorbArgs = ['submodule', 'absorbgitdirs', '--', submodule];
    const deinitArgs = ['submodule', 'deinit', '--', submodule];
    const removeArgs = ['rm', '--', submodule];

    await gitRun(repository, absorbArgs);
    await gitRun(repository, deinitArgs);
    return await gitRun(repository, removeArgs);
  }
}

async function listAll({ repository, switches }: MenuState) {
  const uri = SubmoduleListView.encodeLocation(repository);

  if (!views.has(uri.toString())) {
    views.set(uri.toString(), new SubmoduleListView(uri, repository.magitState!));
  }

  return workspace.openTextDocument(uri)
    .then(doc => window.showTextDocument(doc, { preview: false }));
}

function fetchAll({ repository, switches }: MenuState) {
  return fetchSubmodules({ repository, switches });
}

async function pickSubmodule(repository: MagitRepository, prompt: string): Promise<string | undefined> {
  return await window.showQuickPick(repository.magitState!.submodules.map(r => r.name), { placeHolder: prompt });
}