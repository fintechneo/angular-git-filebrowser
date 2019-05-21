import { browser, by, element, Key } from 'protractor';
import { cwd } from 'process';

export class AppPage {
  navigateTo() {
    return browser.get('/');
  }

  getCloneOrOpenButtonText() {
    return element(by.css('app-root button')).getText();
  }

  async setGitRepositoryUrlInputAndClone() {
    const repositoryUrlElement = element(by.css('input[placeholder="Git repository URL"]'));
    await repositoryUrlElement.sendKeys(Key.CONTROL, 'a', Key.NULL);
    await repositoryUrlElement.sendKeys('https://example.com/testorganization/testrepo');
    
    await element(by.cssContainingText('app-root button', 'Clone or open')).click();

    await browser.wait(async () => (await browser.getCurrentUrl()).indexOf('/browse') > 0, 10000);    
  }

  async setUserAndPull() {
    const repositoryUrlElement = element(by.css('input[placeholder="Git commit name"]'));
    await repositoryUrlElement.sendKeys(Key.CONTROL, 'a', Key.NULL);
    await repositoryUrlElement.sendKeys('User Test');
    
    await element(by.cssContainingText('app-root button', 'Clone or open')).click();

    await browser.wait(async () => (await browser.getCurrentUrl()).indexOf('/browse') > 0, 10000);    
  }

  async deactivateLFSAndUploadFile(filename: string) {
    const lfsCheckbox = element(by.cssContainingText('mat-checkbox', 'Use LFS for uploads'));
    await browser.wait(() => lfsCheckbox.isPresent(), 2000);
    await lfsCheckbox.click();

    await new Promise(r => setTimeout(r, 1000));

    const fileInputElement = element(by.css('input[type=file]'));
    fileInputElement.sendKeys(`${cwd()}/${filename}`);

    await new Promise(r => setTimeout(r, 1000));
  }
}
