import MainContainer from './MainContainer.mjs';

Neo.onStart = () => Neo.app({
    appPath : 'apps/sharedcovid_Gallery/',
    mainView: MainContainer,
    name    : 'CovidGallery'
});