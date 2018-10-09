import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo() {
    return browser.get('/');
  }

  getCloneOrOpenButtonText() {
    return element(by.css('app-root button')).getText();
  }
}
