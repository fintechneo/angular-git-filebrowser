import { AppPage } from './app.po';
import { LocalGitServer } from './localgitserver/localgitserver.class';
import { pathToFileURL } from 'url';
import { browser } from 'protractor';

describe('angular-filebrowser App', () => {
  let page: AppPage;

  let gitserver: LocalGitServer;

  beforeAll(() => {
        gitserver = new LocalGitServer();
        gitserver.start();
  });

  beforeEach(() => {
    page = new AppPage();
  });

  it('should show the clone or open button on the first page', () => {
    page.navigateTo();
    expect(page.getCloneOrOpenButtonText()).toEqual('Clone or open');
  });

  it('should clone and add file to repository', async () => {
    page.navigateTo();
    gitserver.addLogExpectation('GET /testorganization/testrepo/info/refs?service=git-upload-pack');
    await page.setGitRepositoryUrlInputAndClone();
    await page.uploadFileWithoutLFS('README.md');
    expect(gitserver.areLogExpectationsMet()).toBe(true);

    const gitlog = gitserver.gitLog('testorganization', 'testrepo');
    expect(gitlog).toContain('README.md');
    expect(gitlog).toContain('Author: Test <test@example.com>');
  });

  it('should pull, change users name and add another file to repository', async () => {
    page.navigateTo();
    gitserver.addLogExpectation('GET /testorganization/testrepo/info/refs?service=git-upload-pack');
    await page.setUserAndPull();
    await page.uploadFileWithoutLFS('angular.json');
    expect(gitserver.areLogExpectationsMet()).toBe(true);

    const gitlog = gitserver.gitLog('testorganization', 'testrepo');
    expect(gitlog).toContain('angular.json');
    expect(gitlog).toContain('Author: User Test <test@example.com>');
    expect(gitlog).toContain('README.md');
    expect(gitlog).toContain('Author: Test <test@example.com>');
  });
});
