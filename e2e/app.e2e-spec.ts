import { AppPage } from './app.po';

describe('angular-filebrowser App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should show the clone or open button on the first page', () => {
    page.navigateTo();
    expect(page.getCloneOrOpenButtonText()).toEqual('Clone or open');
  });
});
